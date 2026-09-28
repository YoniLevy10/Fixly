'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapPin, Camera, X } from 'lucide-react'
import BackButton from '@/components/shared/BackButton'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Label from '@/components/ui/Label'
import { fetchProfessional } from '@/lib/data/fetch-professional'
import type { Professional } from '@/types/professional'
import { useAuth } from '@/lib/auth/auth-provider'
import { useLocale } from '@/lib/i18n/locale-provider'
import { createRequestApi, RegionClosedError } from '@/shared/hooks/use-requests-api'
import { uploadRequestImage } from '@/lib/storage/upload-request-image'
import { routes } from '@/lib/routes'
import { featureFlags } from '@/lib/feature-flags'
import {
  clearRequestDraft,
  loadRequestDraft,
  saveRequestDraft,
} from '@/lib/request-draft'
import { estimatePriceRange, guessCategorySlug } from '@/lib/estimate/price-estimate'
import { coordsFromLocationText } from '@/lib/tracking/geo'
import { formatPrice } from '@/lib/i18n/format-locale'
import { getStoredReferral } from '@/components/shared/ReferralCapture'
import { track } from '@/lib/analytics/track'
import {
  newIdempotencyKey,
  prefetchGeolocation,
  resolveDestinationCoords,
  type PrefetchedCoords,
} from '@/lib/ux/submit-guards'

type ImagePreview = { preview: string; file: File }
type SubmitPhase = 'idle' | 'uploading' | 'locating' | 'sending'

export default function NewRequestForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const proId = searchParams.get('professional')
  const { user } = useAuth()
  const { t, locale } = useLocale()

  const [pro, setPro] = useState<Professional | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    preferredDate: '',
    preferredTime: '',
    location: user.location ?? '',
    customerPhone: user.phone ?? '',
  })
  const [images, setImages] = useState<ImagePreview[]>([])
  const [phase, setPhase] = useState<SubmitPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [prefetchedCoords, setPrefetchedCoords] = useState<PrefetchedCoords | null>(
    null,
  )
  const submittingRef = useRef(false)
  const idempotencyKeyRef = useRef<string | null>(null)

  const loading = phase !== 'idle'

  useEffect(() => {
    if (proId) {
      fetchProfessional(proId).then((p) => setPro(p ?? null))
    }
  }, [proId])

  useEffect(() => {
    return prefetchGeolocation(setPrefetchedCoords)
  }, [])

  useEffect(() => {
    if (!featureFlags.requestDrafts) return
    const draft = loadRequestDraft()
    if (draft && (!proId || draft.professionalId === proId)) {
      setForm({
        title: draft.title,
        description: draft.description,
        preferredDate: draft.preferredDate,
        preferredTime: draft.preferredTime,
        location: draft.location || (user.location ?? ''),
        customerPhone: draft.customerPhone || (user.phone ?? ''),
      })
    }
  }, [proId, user.location, user.phone])

  useEffect(() => {
    if (!featureFlags.requestDrafts) return
    const tmr = setTimeout(() => {
      saveRequestDraft({ ...form, professionalId: proId ?? undefined })
    }, 800)
    return () => clearTimeout(tmr)
  }, [form, proId])

  const estimate =
    featureFlags.priceEstimate && pro
      ? estimatePriceRange(guessCategorySlug(pro.category))
      : null

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const preview = ev.target?.result as string
        setImages((prev) => [...prev, { preview, file }])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submittingRef.current) return
    if (!pro && !proId) {
      setError(t('requests.mustSelectPro'))
      return
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setError(t('improvements.offline'))
      return
    }

    submittingRef.current = true
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = newIdempotencyKey()
    }
    setPhase(images.length ? 'uploading' : 'locating')
    setError(null)

    try {
      const imageUrls: string[] = []
      for (const img of images) {
        const url = await uploadRequestImage(img.file)
        if (!url) {
          setError(t('requests.imageUploadFailed'))
          return
        }
        imageUrls.push(url)
      }

      setPhase('locating')
      const coords = await resolveDestinationCoords({
        prefetched: prefetchedCoords,
        locationText: form.location,
        timeoutMs: 1200,
        coordsFromLocationText,
      })

      setPhase('sending')
      const created = await createRequestApi({
        customerName: user.fullName,
        customerPhone: form.customerPhone,
        professionalId: pro?.id ?? proId!,
        professionalName: pro?.name ?? '',
        category: pro?.category ?? '',
        title: form.title,
        description: form.description,
        location: form.location,
        city: form.location.split(',').map((p) => p.trim()).at(-1),
        destinationLat: coords.lat,
        destinationLng: coords.lng,
        preferredDate: form.preferredDate || undefined,
        preferredTime: form.preferredTime || undefined,
        images: imageUrls.length ? imageUrls : undefined,
        referralCode: getStoredReferral() ?? undefined,
        idempotencyKey: idempotencyKeyRef.current,
      })

      clearRequestDraft()
      track('request_created', { professionalId: pro?.id ?? proId ?? '' })
      idempotencyKeyRef.current = null
      router.push(routes.tracking(created.id))
    } catch (err) {
      if (err instanceof RegionClosedError) {
        router.push(err.waitlistPath)
        return
      }
      const message =
        err instanceof TypeError
          ? t('improvements.offline')
          : err instanceof Error
            ? err.message
            : t('requests.submitError')
      setError(message)
      // Keep the same idempotency key so a retry after a flaky network
      // cannot create a second request if the first POST actually landed.
    } finally {
      submittingRef.current = false
      setPhase('idle')
    }
  }

  const submitLabel =
    phase === 'uploading'
      ? t('requests.uploadingImages')
      : phase === 'locating'
        ? t('requests.locating')
        : phase === 'sending'
          ? t('common.sending')
          : `${t('requests.submit')} →`

  return (
    <div className="relative min-h-[100dvh] ios27-atmosphere pb-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-primary/10 to-transparent" />
      <div className="relative mx-auto max-w-2xl px-3 pt-3 lg:px-8 lg:pt-6">
        <div className="mb-4 flex items-center gap-3 apple-glass rounded-[var(--radius-lg)] px-3 py-3 animate-ios-fade">
          <BackButton onClick={() => router.back()} />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Fixly
            </p>
            <h1 className="text-lg font-black lg:text-xl">{t('requests.newTitle')}</h1>
          </div>
        </div>

      {estimate && (
        <p className="mb-4 rounded-[var(--radius-md)] bg-muted/50 p-3 text-sm text-muted-foreground apple-glass-pill">
          {t('improvements.estimate')}: {formatPrice(locale, estimate.min)} –{' '}
          {formatPrice(locale, estimate.max)}
        </p>
      )}

      {pro && (
        <div className="ios27-surface mb-4 flex items-center gap-3 p-4 animate-ios-slide-up">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white bg-cover bg-center"
            style={{
              backgroundImage: pro.avatarUrl ? `url(${pro.avatarUrl})` : undefined,
            }}
          >
            {!pro.avatarUrl && pro.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold">{pro.name}</p>
            <p className="text-sm text-muted-foreground">{pro.title ?? pro.category}</p>
          </div>
        </div>
      )}

      {!pro && !proId && (
        <div className="mb-4 rounded-[var(--radius-lg)] border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          {t('requests.noProSelected')}{' '}
          <button
            type="button"
            className="font-medium underline"
            onClick={() => router.push(routes.professionals)}
          >
            {t('requests.findPro')}
          </button>
        </div>
      )}

      {error && (
        <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="ios27-surface space-y-5 p-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0 lg:p-6 animate-ios-slide-up"
      >
        <div className="space-y-5 lg:col-span-2">
          <div>
            <Label>{t('requests.requestTitle')}</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={t('requests.titlePlaceholder')}
              className="mt-1.5"
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label>{t('requests.description')}</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder={t('requests.descriptionPlaceholder')}
              className="mt-1.5 h-28"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <Label className="flex items-center gap-1">
            <Camera size={14} /> {t('requests.photosOptional')}
          </Label>
          <div className="mt-1.5 flex gap-2 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className="relative w-20 h-20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.preview}
                  alt=""
                  className="w-full h-full object-cover rounded-xl"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-destructive rounded-full text-white flex items-center justify-center disabled:opacity-50"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            {images.length < 4 && (
              <label className="w-20 h-20 border-2 border-dashed border-border rounded-xl flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                <Camera size={20} className="text-muted-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={loading}
                  onChange={handleImageAdd}
                />
              </label>
            )}
          </div>
        </div>

        <div>
          <Label>{t('requests.preferredDate')}</Label>
          <Input
            type="date"
            value={form.preferredDate}
            onChange={(e) => setForm((f) => ({ ...f, preferredDate: e.target.value }))}
            className="mt-1.5"
            disabled={loading}
          />
        </div>
        <div>
          <Label>{t('requests.preferredTime')}</Label>
          <Input
            type="time"
            value={form.preferredTime}
            onChange={(e) => setForm((f) => ({ ...f, preferredTime: e.target.value }))}
            className="mt-1.5"
            disabled={loading}
          />
        </div>

        <div>
          <Label className="flex items-center gap-1">
            <MapPin size={14} /> {t('common.address')}
          </Label>
          <Input
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder={t('requests.locationPlaceholder')}
            className="mt-1.5"
            disabled={loading}
          />
        </div>
        <div>
          <Label>{t('requests.contactPhone')}</Label>
          <Input
            type="tel"
            value={form.customerPhone}
            onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
            placeholder={t('requests.phonePlaceholder')}
            className="mt-1.5"
            dir="ltr"
            disabled={loading}
          />
        </div>

        <div className="lg:col-span-2">
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full rounded-2xl bg-secondary py-3.5 text-base font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          >
            {submitLabel}
          </button>
        </div>
      </form>
      </div>
    </div>
  )
}

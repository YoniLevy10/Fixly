'use client'

import { useEffect, useState } from 'react'
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
import { createRequestApi } from '@/shared/hooks/use-requests-api'
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
import { track } from '@/lib/analytics/track'

type ImagePreview = { preview: string; file: File }

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (proId) {
      fetchProfessional(proId).then((p) => setPro(p ?? null))
    }
  }, [proId])

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
    if (!pro && !proId) {
      setError(t('requests.mustSelectPro'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const imageUrls: string[] = []
      for (const img of images) {
        const url = await uploadRequestImage(img.file)
        imageUrls.push(url ?? img.preview)
      }

      let destinationLat: number | undefined
      let destinationLng: number | undefined
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 8000,
              maximumAge: 60000,
            })
          })
          destinationLat = pos.coords.latitude
          destinationLng = pos.coords.longitude
        } catch {
          const fallback = coordsFromLocationText(form.location)
          destinationLat = fallback.lat
          destinationLng = fallback.lng
        }
      } else {
        const fallback = coordsFromLocationText(form.location)
        destinationLat = fallback.lat
        destinationLng = fallback.lng
      }

      await createRequestApi({
        customerName: user.fullName,
        customerPhone: form.customerPhone,
        professionalId: pro?.id ?? proId!,
        professionalName: pro?.name ?? '',
        category: pro?.category ?? '',
        title: form.title,
        description: form.description,
        location: form.location,
        destinationLat,
        destinationLng,
        preferredDate: form.preferredDate || undefined,
        preferredTime: form.preferredTime || undefined,
        images: imageUrls.length ? imageUrls : undefined,
      })

      clearRequestDraft()
      track('request_created', { professionalId: pro?.id ?? proId ?? '' })
      router.push(routes.myRequests)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('requests.submitError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8">
      <div className="flex items-center gap-3 mb-6">
        <BackButton onClick={() => router.back()} />
        <h1 className="text-xl font-black lg:text-2xl">{t('requests.newTitle')}</h1>
      </div>

      {estimate && (
        <p className="text-sm text-muted-foreground mb-4 bg-muted/50 rounded-xl p-3">
          {t('improvements.estimate')}: {formatPrice(locale, estimate.min)} –{' '}
          {formatPrice(locale, estimate.max)}
        </p>
      )}

      {pro && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg bg-cover bg-center"
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 text-sm text-yellow-800">
          {t('requests.noProSelected')}{' '}
          <button
            type="button"
            className="underline font-medium"
            onClick={() => router.push(routes.professionals)}
          >
            {t('requests.findPro')}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 rounded-xl p-3 mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
        <div className="space-y-5 lg:col-span-2">
          <div>
            <Label>{t('requests.requestTitle')}</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={t('requests.titlePlaceholder')}
              className="mt-1.5"
              required
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
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-destructive rounded-full text-white flex items-center justify-center"
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
          />
        </div>
        <div>
          <Label>{t('requests.preferredTime')}</Label>
          <Input
            type="time"
            value={form.preferredTime}
            onChange={(e) => setForm((f) => ({ ...f, preferredTime: e.target.value }))}
            className="mt-1.5"
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
          />
        </div>

        <div className="lg:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary text-white font-bold py-3 text-base rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {loading ? t('common.sending') : `${t('requests.submit')} →`}
          </button>
        </div>
      </form>
    </div>
  )
}

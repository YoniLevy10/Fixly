'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, MapPin, Camera, X } from 'lucide-react'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Label from '@/components/ui/Label'
import { getProfessional } from '@/lib/data/professionals-service'
import type { Professional } from '@/types/professional'
import { useAuth } from '@/lib/auth/auth-provider'
import { createRequestApi } from '@/shared/hooks/use-requests-api'
import { routes } from '@/lib/routes'

type ImagePreview = { preview: string; file: File }

export default function NewRequestForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const proId = searchParams.get('professional')
  const { user } = useAuth()

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
      getProfessional(proId).then((p) => setPro(p ?? null))
    }
  }, [proId])

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
      setError('יש לבחור איש מקצוע לפני שליחת בקשה')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const imageUrls = images.map((img) => img.preview)

      await createRequestApi({
        customerId: user.id,
        customerName: user.fullName,
        customerPhone: form.customerPhone,
        professionalId: pro?.id ?? proId!,
        professionalName: pro?.name ?? '',
        category: pro?.category ?? '',
        title: form.title,
        description: form.description,
        location: form.location,
        preferredDate: form.preferredDate || undefined,
        preferredTime: form.preferredTime || undefined,
        images: imageUrls.length ? imageUrls : undefined,
      })

      router.push(routes.myRequests)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשליחה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-muted"
          aria-label="חזרה"
        >
          <ArrowRight size={20} />
        </button>
        <h1 className="text-xl font-black lg:text-2xl">שלח בקשה</h1>
      </div>

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
          לא נבחר איש מקצוע.{' '}
          <button
            type="button"
            className="underline font-medium"
            onClick={() => router.push(routes.professionals)}
          >
            חפש איש מקצוע
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 rounded-xl p-3 mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
        <div className="space-y-5 lg:col-span-2">
          <div>
            <Label>כותרת הבקשה</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="לדוגמה: תיקון ברז דולף"
              className="mt-1.5 text-right"
              required
            />
          </div>
          <div>
            <Label>תיאור הבעיה</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="תאר את הבעיה בפירוט..."
              className="mt-1.5 text-right h-28"
              required
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <Label className="flex items-center gap-1">
            <Camera size={14} /> תמונות (אופציונלי)
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
                  className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-destructive rounded-full text-white flex items-center justify-center"
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
          <Label>תאריך מועדף</Label>
          <Input
            type="date"
            value={form.preferredDate}
            onChange={(e) => setForm((f) => ({ ...f, preferredDate: e.target.value }))}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>שעה מועדפת</Label>
          <Input
            type="time"
            value={form.preferredTime}
            onChange={(e) => setForm((f) => ({ ...f, preferredTime: e.target.value }))}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label className="flex items-center gap-1">
            <MapPin size={14} /> כתובת
          </Label>
          <Input
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="רחוב, עיר"
            className="mt-1.5 text-right"
          />
        </div>
        <div>
          <Label>טלפון ליצירת קשר</Label>
          <Input
            type="tel"
            value={form.customerPhone}
            onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
            placeholder="050-0000000"
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
            {loading ? 'שולח...' : 'שלח בקשה →'}
          </button>
        </div>
      </form>
    </div>
  )
}

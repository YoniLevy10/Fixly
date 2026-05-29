'use client'

import { useState } from 'react'
import Textarea from '@/components/ui/Textarea'
import Label from '@/components/ui/Label'
import { useLocale } from '@/lib/i18n/locale-provider'

type ReviewFormProps = {
  requestId: string
  professionalId: string
  onSubmitted?: () => void
}

export default function ReviewForm({
  requestId,
  professionalId,
  onSubmitted,
}: ReviewFormProps) {
  const { t } = useLocale()
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, professionalId, rating, text }),
    })
    setLoading(false)
    if (res.ok) {
      setDone(true)
      onSubmitted?.()
    }
  }

  if (done) {
    return (
      <div className="bg-green-50 text-green-800 rounded-2xl p-4 text-center text-sm">
        {t('reviews.thanks')}
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border p-4 space-y-3">
      <h3 className="font-bold">{t('reviews.ratePro')}</h3>
      <div className="flex gap-1 justify-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`text-2xl ${n <= rating ? 'text-yellow-400' : 'text-gray-200'}`}
          >
            ★
          </button>
        ))}
      </div>
      <div>
        <Label>{t('reviews.commentOptional')}</Label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-1 h-20"
          placeholder={t('reviews.commentPlaceholder')}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white py-2.5 rounded-xl font-bold"
      >
        {loading ? t('common.sending') : t('reviews.submit')}
      </button>
    </form>
  )
}

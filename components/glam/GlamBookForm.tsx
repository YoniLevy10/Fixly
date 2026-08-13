'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Clock, CreditCard, Check } from 'lucide-react'
import type { Professional } from '@/types/professional'
import { getBeautyEtaMinutes } from '@/mock/beauty-professionals'
import { routes } from '@/lib/routes'
import { cn } from '@/lib/utils/cn'

type GlamBookFormProps = {
  professional: Professional
}

const TIME_SLOTS = [
  'עכשיו · הגעה מיידית',
  'בעוד שעה',
  'היום · אחה״צ',
  'היום · ערב',
  'מחר · בוקר',
  'מחר · אחה״צ',
]

export default function GlamBookForm({ professional: pro }: GlamBookFormProps) {
  const router = useRouter()
  const services = pro.services ?? [{ name: pro.category, price: pro.startingPrice }]
  const [serviceIdx, setServiceIdx] = useState(0)
  const [slot, setSlot] = useState(TIME_SLOTS[0]!)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [placeType, setPlaceType] = useState<'home' | 'hotel' | 'office'>('home')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  const service = services[serviceIdx]!
  const eta = useMemo(() => getBeautyEtaMinutes(pro), [pro])
  const platformFee = Math.round(service.price * 0.08)
  const total = service.price + platformFee

  const placeLabel =
    placeType === 'home' ? 'בית' : placeType === 'hotel' ? 'מלון' : 'משרד'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError('נא למלא שם, טלפון וכתובת')
      return
    }
    setPaying(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professionalId: pro.id,
          professionalName: pro.name,
          serviceName: service.name,
          servicePrice: service.price,
          platformFee,
          total,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          address: address.trim(),
          placeType,
          timeSlot: slot,
          etaMinutes: eta,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'שגיאה בהזמנה')
      router.push(routes.bookSuccess(data.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהזמנה')
      setPaying(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-28 lg:pb-8">
      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-2xl bg-cover bg-center ring-1 ring-border"
          style={{ backgroundImage: pro.avatarUrl ? `url(${pro.avatarUrl})` : undefined }}
        />
        <div>
          <p className="font-bold">{pro.name}</p>
          <p className="text-sm text-muted-foreground">{pro.title ?? pro.category}</p>
          <p className="text-xs text-[hsl(152_40%_32%)] font-semibold mt-0.5">
            הגעה משוערת ≈ {eta} דק׳
          </p>
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-bold mb-2">בחרו שירות</legend>
        <div className="space-y-2">
          {services.map((s, i) => (
            <button
              key={`${s.name}-${i}`}
              type="button"
              onClick={() => setServiceIdx(i)}
              className={cn(
                'w-full flex items-center justify-between rounded-2xl border px-4 py-3 text-start transition-colors',
                serviceIdx === i
                  ? 'border-[hsl(350_38%_55%)] bg-[hsl(350_40%_96%)]'
                  : 'border-border bg-card hover:border-[hsl(350_30%_75%)]'
              )}
            >
              <span className="font-medium text-sm">{s.name}</span>
              <span className="font-black">₪{s.price}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-bold mb-2 flex items-center gap-1.5">
          <Clock size={14} /> מתי?
        </legend>
        <div className="flex flex-wrap gap-2">
          {TIME_SLOTS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSlot(t)}
              className={cn(
                'rounded-full px-3.5 py-2 text-xs font-semibold border transition-colors',
                slot === t
                  ? 'bg-[hsl(20_14%_12%)] text-white border-transparent'
                  : 'bg-card border-border text-foreground/80'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-bold mb-2">איפה?</legend>
        <div className="flex gap-2 mb-3">
          {(
            [
              ['home', 'בית'],
              ['hotel', 'מלון'],
              ['office', 'משרד'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPlaceType(key)}
              className={cn(
                'flex-1 rounded-xl py-2.5 text-xs font-bold border transition-colors',
                placeType === key
                  ? 'bg-[hsl(350_38%_62%)] text-white border-transparent'
                  : 'bg-card border-border'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="block text-xs text-muted-foreground mb-1">
          כתובת מלאה ({placeLabel})
        </label>
        <div className="relative">
          <MapPin
            size={16}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="רחוב, מספר, עיר / שם מלון"
            className="w-full rounded-2xl border border-border bg-card pe-4 ps-10 py-3 text-sm outline-none focus:border-[hsl(350_38%_55%)]"
          />
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">שם מלא</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-[hsl(350_38%_55%)]"
            placeholder="איך קוראים לכם?"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">טלפון</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-[hsl(350_38%_55%)]"
            placeholder="05X-XXXXXXX"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{service.name}</span>
          <span>₪{service.price}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">דמי שירות</span>
          <span>₪{platformFee}</span>
        </div>
        <div className="flex justify-between font-black text-base pt-2 border-t border-border">
          <span>סה״כ לתשלום</span>
          <span>₪{total}</span>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive font-medium" role="alert">
          {error}
        </p>
      )}

      <div className="fixed bottom-0 inset-x-0 z-40 lg:static lg:z-auto border-t border-border lg:border-0 bg-card/95 backdrop-blur lg:bg-transparent p-4 lg:p-0 safe-area-pb">
        <button
          type="submit"
          disabled={paying || !pro.isAvailable}
          className={cn(
            'w-full rounded-2xl py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all',
            'bg-[hsl(20_14%_12%)] text-white hover:bg-[hsl(20_14%_8%)]',
            'disabled:opacity-50 disabled:pointer-events-none',
            'active:scale-[0.99]'
          )}
        >
          {paying ? (
            'מעבד תשלום...'
          ) : !pro.isAvailable ? (
            'לא זמין כרגע'
          ) : (
            <>
              <CreditCard size={18} />
              שלמו ₪{total} והזמינו
            </>
          )}
        </button>
        <p className="text-[11px] text-center text-muted-foreground mt-2 flex items-center justify-center gap-1">
          <Check size={12} className="text-[hsl(152_40%_36%)]" />
          תשלום מאובטח · בעל המקצוע מסונן ומאומת
        </p>
      </div>
    </form>
  )
}

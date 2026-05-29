import Link from 'next/link'
import type { Professional } from '@/types/professional'
import { routes } from '@/lib/routes'

type FeaturedProCardProps = {
  professional: Professional
}

export default function FeaturedProCard({ professional }: FeaturedProCardProps) {
  const pro = professional

  return (
    <div className="flex-shrink-0 w-40">
      <Link href={routes.professional(pro.id)}>
        <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center hover:shadow-md transition-all active:scale-95">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-2 bg-primary text-white flex items-center justify-center font-bold text-xl bg-cover bg-center border-2 border-gray-50 shadow-sm"
            style={{
              backgroundImage: pro.avatarUrl ? `url(${pro.avatarUrl})` : undefined,
            }}
          >
            {!pro.avatarUrl && pro.name.charAt(0)}
          </div>
          <p className="font-bold text-sm leading-tight">{pro.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{pro.title ?? pro.category}</p>
          <div className="flex items-center justify-center gap-0.5 mt-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={`text-xs ${s <= Math.round(pro.rating) ? 'text-yellow-400' : 'text-gray-200'}`}
              >
                ★
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {pro.rating.toFixed(1)} ({pro.reviewCount})
          </p>
          <div
            className={`mt-2 text-xs font-semibold flex items-center justify-center gap-1 ${pro.isAvailable ? 'text-green-500' : 'text-gray-400'}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${pro.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`}
            />
            {pro.isAvailable ? 'זמין עכשיו' : 'לא זמין'}
          </div>
        </div>
      </Link>
    </div>
  )
}

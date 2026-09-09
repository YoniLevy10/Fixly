type CardProps = {
  children: React.ReactNode
  className?: string
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-white rounded-[22px] sm:rounded-[28px] p-4 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] min-w-0 overflow-hidden ${className}`}
    >
      {children}
    </div>
  )
}

type CardProps = {
  children: React.ReactNode
  className?: string
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`ios27-surface p-4 sm:p-6 min-w-0 overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

import { BrandSplash } from '@/components/brand/FixlyMark'

type LoadingBoundaryProps = {
  loading: boolean
  children: React.ReactNode
  label?: string
}

export function LoadingBoundary({
  loading,
  children,
  label = 'טוען…',
}: LoadingBoundaryProps) {
  if (loading) {
    return <BrandSplash label={label} />
  }

  return <>{children}</>
}

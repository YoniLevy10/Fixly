type LoadingBoundaryProps = {
  loading: boolean
  children: React.ReactNode
}

export function LoadingBoundary({
  loading,
  children,
}: LoadingBoundaryProps) {
  if (loading) {
    return <p>Loading...</p>
  }

  return <>{children}</>
}

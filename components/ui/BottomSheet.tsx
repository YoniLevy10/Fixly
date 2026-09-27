type BottomSheetProps = {
  children: React.ReactNode
}

export default function BottomSheet({ children }: BottomSheetProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 apple-glass-strong rounded-t-[var(--radius-xl)] px-5 pt-4 pb-8 animate-ios-slide-up safe-area-pb">
      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-foreground/15" />
      {children}
    </div>
  )
}

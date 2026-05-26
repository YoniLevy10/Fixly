type BottomSheetProps = {
  children: React.ReactNode
}

export default function BottomSheet({
  children,
}: BottomSheetProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderTopLeftRadius: '34px',
        borderTopRightRadius: '34px',
        padding: '16px 20px 34px',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.08)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '6px',
          borderRadius: '999px',
          background: '#E5E7EB',
          margin: '0 auto 18px',
        }}
      />

      {children}
    </div>
  )
}

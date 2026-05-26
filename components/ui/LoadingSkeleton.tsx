export default function LoadingSkeleton() {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '28px',
        padding: '24px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: '#F3F4F6',
          marginBottom: '18px',
        }}
      />

      <div
        style={{
          width: '60%',
          height: '18px',
          borderRadius: '999px',
          background: '#F3F4F6',
          marginBottom: '12px',
        }}
      />

      <div
        style={{
          width: '40%',
          height: '14px',
          borderRadius: '999px',
          background: '#F3F4F6',
          marginBottom: '22px',
        }}
      />

      <div
        style={{
          width: '100%',
          height: '52px',
          borderRadius: '18px',
          background: '#F3F4F6',
        }}
      />
    </div>
  )
}

export default function BottomNav() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        background: 'white',
        borderRadius: '28px',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ color: '#005BFF', fontWeight: 700 }}>🏠 Home</div>
      <div style={{ color: '#9CA3AF' }}>📂 Orders</div>
      <div style={{ color: '#9CA3AF' }}>❤️ Saved</div>
      <div style={{ color: '#9CA3AF' }}>👤 Profile</div>
    </div>
  )
}

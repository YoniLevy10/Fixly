const categories = [
  "Electrician",
  "Plumber",
  "Cleaning",
  "Locksmith",
  "Painting",
  "Appliance Repair",
];

export default function HomePage() {
  return (
    <main
      style={{
        padding: "24px",
        minHeight: "100vh",
        background: "#f5f7fb",
      }}
    >
      <div
        style={{
          marginBottom: "32px",
        }}
      >
        <h1
          style={{
            fontSize: "38px",
            fontWeight: 700,
            color: "#005BFF",
            marginBottom: "8px",
          }}
        >
          Fixly
        </h1>

        <p
          style={{
            color: "#666",
            fontSize: "18px",
          }}
        >
          Book trusted professionals instantly
        </p>
      </div>

      <input
        placeholder="Search service..."
        style={{
          width: "100%",
          padding: "18px",
          borderRadius: "18px",
          border: "none",
          fontSize: "16px",
          marginBottom: "28px",
          boxSizing: "border-box",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
        }}
      >
        {categories.map((category) => (
          <div
            key={category}
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "28px 20px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
              fontWeight: 600,
              fontSize: "16px",
            }}
          >
            {category}
          </div>
        ))}
      </div>
    </main>
  );
}
type JsonLdProps = {
  data: unknown | unknown[]
}

/** Server-safe JSON-LD script tag(s). */
function JsonLd({ data }: JsonLdProps) {
  const nodes = Array.isArray(data) ? data : [data]
  return (
    <>
      {nodes.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
    </>
  )
}

export default JsonLd
/** Named export for SEO landing modules that import `{ JsonLd }`. */
export { JsonLd }

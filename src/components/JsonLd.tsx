interface JsonLdProps {
  data: Record<string, unknown> | (Record<string, unknown> | null | undefined)[]
  nonce?: string
}

// Safely escape JSON for script tags to prevent XSS
function safeJsonStringify(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

export default function JsonLd({ data, nonce }: JsonLdProps) {
  const jsonLdArray = (Array.isArray(data) ? data : [data]).filter(Boolean)

  return (
    <>
      {jsonLdArray.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: safeJsonStringify(item) }}
        />
      ))}
    </>
  )
}

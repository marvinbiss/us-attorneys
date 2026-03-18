// Set lang="es" on Spanish pages without making root layout dynamic.
// This script runs before hydration to avoid FOUC.
export default function AbogadosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang="es"`,
        }}
      />
      {children}
    </>
  )
}

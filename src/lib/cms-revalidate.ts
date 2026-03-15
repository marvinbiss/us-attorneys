import { revalidatePath } from 'next/cache'

export function revalidatePagePaths(page: {
  page_type: string
  slug: string
  service_slug?: string | null
  location_slug?: string | null
}) {
  switch (page.page_type) {
    case 'static': revalidatePath(`/${page.slug}`); break
    case 'blog': revalidatePath(`/blog/${page.slug}`); revalidatePath('/blog'); break
    case 'service': revalidatePath(`/practice-areas/${page.slug}`); break
    case 'location':
      if (page.service_slug && page.location_slug) {
        revalidatePath(`/practice-areas/${page.service_slug}/${page.location_slug}`)
      }
      break
    case 'homepage': revalidatePath('/'); break
    case 'faq': revalidatePath('/faq'); break
  }
}

import { permanentRedirect } from 'next/navigation'

export default function Page({ params }: { params: { service: string; city: string } }) {
  permanentRedirect(`/pricing/${params.service}/${params.city}`)
}

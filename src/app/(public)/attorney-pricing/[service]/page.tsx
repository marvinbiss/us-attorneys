import { permanentRedirect } from 'next/navigation'

export default function Page({ params }: { params: { service: string } }) {
  permanentRedirect(`/pricing/${params.service}`)
}

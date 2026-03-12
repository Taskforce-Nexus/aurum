import { redirect } from 'next/navigation'

export default function SemillaPage({ params }: { params: { id: string } }) {
  redirect(`/project/${params.id}/incubadora`)
}

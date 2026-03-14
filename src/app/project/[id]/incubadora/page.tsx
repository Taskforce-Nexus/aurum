import { redirect } from 'next/navigation'

export default function IncubadoraPage({ params }: { params: { id: string } }) {
  redirect(`/project/${params.id}/seed-session`)
}

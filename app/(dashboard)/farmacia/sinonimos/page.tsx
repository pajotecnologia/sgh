import { redirect } from 'next/navigation'

export default async function PaginaSinonimosFarmacia({
  searchParams,
}: {
  searchParams: Promise<{ medicamentoId?: string }>
}) {
  const { medicamentoId } = await searchParams
  if (medicamentoId) {
    redirect(`/cadastros/sinonimos?medicamentoId=${medicamentoId}`)
  }
  redirect('/cadastros/sinonimos')
}

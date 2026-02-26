import { createLazyFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { trpc } from '@/client/trpc'
import { ProductsDashboard } from '@/client/components/dashboard/products/ProductsDashboard'

export const Route = createLazyFileRoute('/products')({
  component: ProductsPage,
})

function ProductsPage() {
  const utils = trpc.useUtils()
  const { data: products, isLoading, refetch } = trpc.products.list.useQuery(undefined, {
    refetchOnMount: true,
    staleTime: 60_000,
  })

  // SSE-driven invalidation: when produtos file updates, refresh product list
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { name?: string }
      if (detail.name === 'produtos') {
        utils.products.list.invalidate()
      }
    }
    window.addEventListener('file:updated', handler)
    return () => window.removeEventListener('file:updated', handler)
  }, [utils])

  const seedMutation = trpc.products.seed.useMutation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 text-sm">Carregando produtos...</span>
        </div>
      </div>
    )
  }

  const productList = (products ?? []) as Array<{
    id: number
    name: string
    description: string | null
    price: string | null
    format: string | null
    category: string | null
    details: Record<string, unknown> | null
  }>

  const handleSeed = async () => {
    await seedMutation.mutateAsync()
    refetch()
  }

  return (
    <div className="flex flex-col h-full">
      <ProductsDashboard
        products={productList}
        onRefresh={() => refetch()}
      />
      {productList.length === 0 && (
        <div className="absolute bottom-6 right-6">
          <button
            onClick={handleSeed}
            disabled={seedMutation.isPending}
            className="text-xs text-slate-400 hover:text-indigo-600 underline transition-colors"
          >
            {seedMutation.isPending ? 'Importando...' : 'Importar produtos do PRODUTOS_GRUPO_US.md'}
          </button>
        </div>
      )}
    </div>
  )
}

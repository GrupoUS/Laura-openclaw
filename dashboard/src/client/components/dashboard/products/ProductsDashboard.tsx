import { useState } from 'react'
import { ProductCard } from './ProductCard'
import { ProductEditPanel } from './ProductEditPanel'
import { SyncStatus } from './SyncStatus'

interface Product {
  id: number
  name: string
  description: string | null
  price: string | null
  format: string | null
  category: string | null
  details: Record<string, unknown> | null
}

interface Props {
  products: Product[]
  onRefresh: () => void
}

export function ProductsDashboard({ products, onRefresh }: Props) {
  const [editing, setEditing] = useState<Product | null>(null)
  const [isNew, setIsNew] = useState(false)

  const openNew = () => {
    setEditing(null)
    setIsNew(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setIsNew(false)
  }

  const closePanel = () => {
    setEditing(null)
    setIsNew(false)
  }

  const handleSaved = () => {
    closePanel()
    onRefresh()
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <header className="h-14 border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-slate-900">📦 Produtos</h1>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {products.length} produto{products.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <SyncStatus />
          <button
            onClick={openNew}
            className="text-xs font-medium px-4 py-1.5 rounded-md bg-indigo-600 text-white
                       hover:bg-indigo-700 transition-colors"
          >
            + Novo Produto
          </button>
        </div>
      </header>

      {/* Product Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        <div className="max-w-[1400px] mx-auto">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <span className="text-4xl">📦</span>
              <p className="text-sm text-slate-500">Nenhum produto cadastrado.</p>
              <button
                onClick={openNew}
                className="text-xs font-medium px-4 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Criar Primeiro Produto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onEdit={openEdit} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Panel */}
      {(editing !== null || isNew) && (
        <ProductEditPanel
          product={editing}
          isNew={isNew}
          onClose={closePanel}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

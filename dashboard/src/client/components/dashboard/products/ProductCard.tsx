interface Product {
  id: number
  name: string
  description: string | null
  price: string | null
  format: string | null
  category: string | null
  details: Record<string, unknown> | null
}

const CATEGORY_COLORS: Record<string, string> = {
  'Comunidade': 'bg-purple-100 text-purple-700',
  'MBA': 'bg-blue-100 text-blue-700',
  'Pós-Graduação': 'bg-teal-100 text-teal-700',
  'Mentoria': 'bg-amber-100 text-amber-700',
  'Curso': 'bg-green-100 text-green-700',
}

export function ProductCard({
  product,
  onEdit,
}: {
  product: Product
  onEdit: (product: Product) => void
}) {
  const details = (product.details ?? {}) as Record<string, unknown>
  const categoryClass = CATEGORY_COLORS[product.category ?? ''] ?? 'bg-slate-100 text-slate-600'

  return (
    <button
      type="button"
      className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3
                 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer text-left w-full"
      onClick={() => onEdit(product)}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 leading-tight">{product.name}</h3>
        {product.category && (
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${categoryClass}`}>
            {product.category}
          </span>
        )}
      </div>

      {product.description && (
        <p className="text-xs text-slate-500 line-clamp-2">{product.description}</p>
      )}

      <div className="flex flex-wrap gap-2 mt-auto">
        {product.format && (
          <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
            {product.format}
          </span>
        )}
        {product.price && (
          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
            R$ {product.price}
          </span>
        )}
      </div>

      {(String(details.paymentLink ?? '') || String(details.site ?? '')) && (
        <div className="flex gap-2 pt-1 border-t border-slate-100">
          {typeof details.site === 'string' && details.site && (
            <a
              href={details.site}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] text-indigo-500 hover:underline"
            >
              Site
            </a>
          )}
          {typeof details.paymentLink === 'string' && details.paymentLink && (
            <a
              href={details.paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] text-indigo-500 hover:underline"
            >
              Link de Venda
            </a>
          )}
        </div>
      )}
    </button>
  )
}

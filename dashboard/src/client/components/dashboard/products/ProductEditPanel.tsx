import { useState, useEffect } from 'react'
import { trpc } from '@/client/trpc'

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
  product: Product | null
  isNew: boolean
  onClose: () => void
  onSaved: () => void
}

const CATEGORIES = ['Comunidade', 'MBA', 'Pós-Graduação', 'Mentoria', 'Curso']

export function ProductEditPanel({ product, isNew, onClose, onSaved }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [format, setFormat] = useState('')
  const [category, setCategory] = useState('')
  const [detailsJson, setDetailsJson] = useState('{}')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upsertMutation = trpc.products.upsert.useMutation()
  const deleteMutation = trpc.products.delete.useMutation()

  useEffect(() => {
    if (product) {
      setName(product.name)
      setDescription(product.description ?? '')
      setPrice(product.price ?? '')
      setFormat(product.format ?? '')
      setCategory(product.category ?? '')
      setDetailsJson(JSON.stringify(product.details ?? {}, null, 2))
    } else {
      setName('')
      setDescription('')
      setPrice('')
      setFormat('')
      setCategory('')
      setDetailsJson('{}')
    }
    setError(null)
  }, [product])

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }

    let details: Record<string, unknown> = {}
    try {
      details = JSON.parse(detailsJson)
    } catch {
      setError('JSON de detalhes inválido')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await upsertMutation.mutateAsync({
        id: isNew ? undefined : product?.id,
        name: name.trim(),
        description: description || undefined,
        price: price || undefined,
        format: format || undefined,
        category: category || undefined,
        details,
      })
      onSaved()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!product || isNew) return
    if (!confirm(`Deletar "${product.name}"?`)) return

    setSaving(true)
    try {
      await deleteMutation.mutateAsync({ id: product.id })
      onSaved()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/20 cursor-default" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white border-l border-slate-200 shadow-xl flex flex-col h-full">
        {/* Header */}
        <div className="h-14 border-b border-slate-200 flex items-center justify-between px-5 shrink-0">
          <h2 className="text-sm font-semibold text-slate-900">
            {isNew ? 'Novo Produto' : `Editar: ${product?.name}`}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          <Field label="Nome" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Ex: TRINTAE3"
            />
          </Field>

          <Field label="Descrição">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Descrição do produto..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Preço">
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Ex: 4997.00"
              />
            </Field>

            <Field label="Formato">
              <input
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Ex: MBA, Mentoria..."
              />
            </Field>
          </div>

          <Field label="Categoria">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">Selecionar...</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Detalhes (JSON)">
            <textarea
              value={detailsJson}
              onChange={(e) => setDetailsJson(e.target.value)}
              rows={8}
              className="w-full font-mono text-xs border border-slate-300 rounded-md px-3 py-2 resize-y
                         bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              spellCheck={false}
              placeholder='{"requirements": "...", "paymentLink": "...", "site": "..."}'
            />
          </Field>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
          {!isNew && product && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
            >
              Deletar
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs font-medium px-4 py-1.5 rounded-md bg-indigo-600 text-white
                         disabled:opacity-40 hover:bg-indigo-700 transition-colors"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-600">
        {label} {required && <span className="text-red-400">*</span>}
      </span>
      {children}
    </label>
  )
}

import { createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { trpc } from '@/client/trpc'

export const Route = createLazyFileRoute('/content-strategy')({
  component: ContentStrategyPage,
})

// ──────────────────────────────────────────────
// Simple markdown renderer (no external dep)
// ──────────────────────────────────────────────
function renderMarkdown(md: string): string {
  return md
    // code blocks
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre class="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 overflow-x-auto text-xs font-mono my-3">$1</pre>')
    // inline code
    .replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-slate-800 rounded px-1 py-0.5 text-xs font-mono">$1</code>')
    // bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    // italic
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    // h1
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3 text-slate-900 dark:text-slate-100">$1</h1>')
    // h2
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-5 mb-2 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1">$1</h2>')
    // h3
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-1.5 text-slate-700 dark:text-slate-300">$1</h3>')
    // horizontal rule
    .replace(/^---$/gm, '<hr class="border-slate-200 dark:border-slate-700 my-4" />')
    // tables (basic)
    .replace(/^\|(.+)\|$/gm, (row) => {
      const cells = row.split('|').filter(Boolean).map(c => c.trim())
      const isSep = cells.every(c => /^[-:]+$/.test(c))
      if (isSep) return ''
      return '<tr>' + cells.map(c => `<td class="border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm">${c}</td>`).join('') + '</tr>'
    })
    // wrap table rows
    .replace(/(<tr>[\s\S]*?<\/tr>\n*)+/g, (t) => `<div class="overflow-x-auto my-3"><table class="border-collapse border border-slate-200 dark:border-slate-700 rounded-lg w-full">${t}</table></div>`)
    // blockquote
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-pink-400 pl-4 italic text-slate-500 dark:text-slate-400 my-2">$1</blockquote>')
    // unordered list items
    .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
    // ordered list items
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm">$1</li>')
    // wrap consecutive li
    .replace(/(<li[\s\S]*?<\/li>\n*)+/g, (list) => `<ul class="my-2 space-y-0.5">${list}</ul>`)
    // paragraphs (non-tagged lines)
    .replace(/^(?!<[a-z]|$)(.+)$/gm, '<p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">$1</p>')
    // blank lines
    .replace(/\n{3,}/g, '\n\n')
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div
      className="prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  )
}

// ──────────────────────────────────────────────
// Calendar data derived from the markdown
// ──────────────────────────────────────────────
const WEEK_DAYS = [
  {
    day: 'SEG', date: '02/03',
    format: 'Carrossel', formatIcon: '🖼️', formatColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    hora: '18h00',
    produto: 'Brand',
    objetivo: 'Alcance + Salvos',
    objColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    tema: 'Por que mulheres estão migrando para a Saúde Estética em 2026',
    prioridade: '🔴',
  },
  {
    day: 'TER', date: '03/03',
    format: 'Reel', formatIcon: '🎬', formatColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    hora: '19h00',
    produto: 'TRINTAE3',
    objetivo: 'Alcance Orgânico',
    objColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    tema: '3 técnicas de estética que mais faturam em clínicas em 2026',
    prioridade: '🔴',
  },
  {
    day: 'QUA', date: '04/03',
    format: 'Carrossel', formatIcon: '🖼️', formatColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    hora: '12h00',
    produto: 'TRINTAE3',
    objetivo: 'Engajamento + Confiança',
    objColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    tema: 'Prova Social — Depoimento de aluna com resultado financeiro',
    prioridade: '🔴',
  },
  {
    day: 'QUI', date: '05/03',
    format: 'Reel', formatIcon: '🎬', formatColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    hora: '19h00',
    produto: 'TRINTAE3',
    objetivo: 'Conversão',
    objColor: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    tema: 'Pitch TRINTAE3 — A pós que está formando as profissionais mais bem pagas',
    prioridade: '🔴',
  },
  {
    day: 'SEX', date: '06/03',
    format: 'Reel', formatIcon: '🎬', formatColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    hora: '18h00',
    produto: 'Brand',
    objetivo: 'Conexão + Compartilhamentos',
    objColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    tema: 'Bastidores emocionais — Por dentro do Grupo US',
    prioridade: '🟡',
  },
  {
    day: 'SÁB', date: '07/03',
    format: 'Stories + Feed', formatIcon: '💬', formatColor: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    hora: '10h00',
    produto: 'Brand + NEON',
    objetivo: 'Engajamento Máximo',
    objColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    tema: 'Celebração Dia da Mulher 🌸 + Enquete de Engajamento',
    prioridade: '🔴',
  },
]

const TABS = [
  { id: 'calendario', label: '📅 Calendário', key: 'calendario' },
  { id: 'copies', label: '✍️ Copies & Captions', key: 'copies' },
  { id: 'reels', label: '🎬 Roteiros Reels', key: 'reels' },
  { id: 'stories', label: '💬 Scripts Stories', key: 'stories' },
  { id: 'trafego', label: '📣 Tráfego Pago', key: 'trafego' },
  { id: 'tendencias', label: '🔍 Tendências', key: 'tendencias' },
] as const

type TabKey = typeof TABS[number]['id']

// ──────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────
function ContentStrategyPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('calendario')
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set())

  const { data, isLoading } = trpc.contentStrategy.all.useQuery()

  const ALERTS = [
    { id: 0, text: 'Confirmar disponibilidade Dra. Sacha para gravações (Ter/Qui/Sex)' },
    { id: 1, text: 'Selecionar aluna para depoimento da Quarta (04/03)' },
    { id: 2, text: 'Aprovar orçamento de tráfego pago (~R$400–700)' },
  ]

  const activeAlerts = ALERTS.filter(a => !dismissedAlerts.has(a.id))

  const getTabContent = () => {
    if (!data) return ''
    switch (activeTab) {
      case 'calendario': return data.calendario
      case 'copies':     return data.copies
      case 'reels':      return data.reels
      case 'stories':    return data.stories
      case 'trafego':    return data.trafego
      case 'tendencias': return data.tendencias
      default:           return ''
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6">
      {/* ── HEADER ── */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Estratégia de Conteúdo
          </h1>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium
                           bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
            🌸 Pré-Dia da Mulher
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Semana 02 – 07/03/2026 · Instagram · Grupo US
        </p>
      </div>

      {/* ── PENDÊNCIAS ── */}
      {activeAlerts.length > 0 && (
        <div className="mb-6 flex flex-col gap-2">
          {activeAlerts.map(alert => (
            <div key={alert.id}
                 className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl
                            bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
                <span className="text-base">⚠️</span>
                <span>{alert.text}</span>
              </div>
              <button
                onClick={() => setDismissedAlerts(prev => new Set([...prev, alert.id]))}
                className="shrink-0 text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors text-xs"
                title="Dispensar"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── WEEKLY CALENDAR ── */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
          📆 Semana Visual
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {WEEK_DAYS.map((d) => {
            const isExpanded = expandedDay === d.day
            return (
              <div key={d.day}>
                <button
                  onClick={() => setExpandedDay(isExpanded ? null : d.day)}
                  className={`w-full text-left rounded-xl border transition-all duration-200
                              ${isExpanded
                                ? 'bg-white dark:bg-slate-800 border-pink-300 dark:border-pink-700 shadow-md'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'
                              } p-3`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{d.day}</div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{d.date}</div>
                    </div>
                    <span className="text-base">{d.prioridade}</span>
                  </div>

                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${d.formatColor}`}>
                    <span>{d.formatIcon}</span>
                    <span>{d.format}</span>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    🕐 {d.hora}
                  </div>
                  <div className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${d.objColor}`}>
                    {d.objetivo}
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Tema:</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{d.tema}</p>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-2 mb-0.5">Produto:</p>
                      <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {d.produto}
                      </span>
                    </div>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
                          ${activeTab === tab.id
                            ? 'border-b-2 border-pink-500 text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/30'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5 md:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <span className="animate-spin text-2xl mr-3">⟳</span>
              Carregando documentos…
            </div>
          ) : (
            <MarkdownContent content={getTabContent()} />
          )}
        </div>
      </div>
    </div>
  )
}

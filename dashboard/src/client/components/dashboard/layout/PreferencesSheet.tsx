import {
  Sheet, SheetContent, SheetHeader,
  SheetTitle, SheetDescription,
} from '../ui/sheet'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '../ui/select'
import type { UserPreferences } from '@/server/session'
import type { usePreferences } from '@/client/hooks/usePreferences'

type PrefsHook = ReturnType<typeof usePreferences>

interface Props {
  open:        boolean
  onClose:     () => void
  prefs:       UserPreferences
  updatePref:  PrefsHook['updatePref']
}

export function PreferencesSheet({ open, onClose, prefs, updatePref }: Props) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" className="w-80 bg-white dark:bg-slate-900
                                            border-r border-slate-200 dark:border-slate-700">
        <SheetHeader>
          <SheetTitle className="text-slate-900 dark:text-slate-100">
            ⚙️ Preferências
          </SheetTitle>
          <SheetDescription className="text-slate-500 dark:text-slate-400">
            Suas preferências são salvas automaticamente.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 mt-6">
          {/* View padrão */}
          <div>
            <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300
                               uppercase tracking-wider mb-2 block">
              View padrão ao entrar
            </h3>
            <Select
              value={prefs.defaultView}
              onValueChange={(v) => updatePref('defaultView', v as UserPreferences['defaultView'])}
            >
              <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                <SelectItem value="board">🗂️ Tasks</SelectItem>
                <SelectItem value="agents">🤖 Agentes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Compact mode */}
          <div>
            <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300
                               uppercase tracking-wider mb-3 block">
              Densidade dos cards
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(['normal', 'compact'] as const).map((mode) => {
                const active = (mode === 'compact') === prefs.compactMode
                return (
                  <button
                    key={mode}
                    onClick={() => updatePref('compactMode', mode === 'compact')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2
                                text-xs font-medium transition-all ${
                      active
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <span className="text-xl">
                      {mode === 'normal' ? '🃏' : '📄'}
                    </span>
                    {mode === 'normal' ? 'Normal' : 'Compacto'}
                  </button>
                )
              })}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
              Compacto reduz o padding dos cards para ver mais tasks na tela.
            </p>
          </div>

          {/* Sidebar */}
          <div>
            <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300
                               uppercase tracking-wider mb-3 block">
              Sidebar
            </h3>
            <button
              onClick={() => updatePref('sidebarCollapsed', !prefs.sidebarCollapsed)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2
                          text-xs font-medium transition-all ${
                prefs.sidebarCollapsed
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>{prefs.sidebarCollapsed ? '⊞' : '⊟'}</span>
              {prefs.sidebarCollapsed ? 'Sidebar colapsada (ícones apenas)' : 'Sidebar expandida'}
            </button>
          </div>

          {/* Tema — delegado ao ThemeToggle */}
          <div>
            <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300
                               uppercase tracking-wider mb-3 block">
              Tema visual
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Use o botão 🖥️/☀️/🌙 no cabeçalho para trocar entre sistema, claro e escuro.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

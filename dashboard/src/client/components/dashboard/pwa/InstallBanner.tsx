import React from 'react'

type Platform = 'ios' | 'android' | null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function InstallBanner() {
  const [platform, setPlatform] = React.useState<Platform>(null)
  const [open, setOpen] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferred, setDeferred] = React.useState<any>(null)

  React.useEffect(() => {
    // already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // dismissed in session
    if (sessionStorage.getItem('pwa-banner-dismissed')) return

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (isIOS) {
      setPlatform('ios')
      setOpen(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e)
      setPlatform('android')
      setOpen(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    setOpen(false)
    sessionStorage.setItem('pwa-banner-dismissed', '1')
  }

  const install = async () => {
    if (deferred) {
      deferred.prompt()
      await deferred.userChoice
      setDeferred(null)
    }
    dismiss()
  }

  if (!open || !platform) return null

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 md:hidden
                 bg-blue-600 dark:bg-blue-700 text-white
                 rounded-2xl shadow-2xl p-4"
    >
      <div className="flex items-start gap-3">
        <img src="/icons/icon-192.png" className="w-12 h-12 rounded-xl" alt="Laura" />
        <div className="flex-1">
          <p className="font-semibold text-sm">Instalar Laura</p>
          {platform === 'ios' ? (
            <p className="text-xs text-blue-100 mt-0.5">
              Toque em <span className="font-medium">Compartilhar</span> →{' '}
              <span className="font-medium">Adicionar à Tela de Início</span>
            </p>
          ) : (
            <p className="text-xs text-blue-100 mt-0.5">
              Instale para abrir como app (standalone)
            </p>
          )}
        </div>
        <button onClick={dismiss} className="text-blue-200 hover:text-white text-lg leading-none" aria-label="Fechar">
          ✕
        </button>
      </div>

      {platform === 'android' && (
        <button
          onClick={install}
          className="mt-3 w-full bg-white text-blue-700 font-semibold
                     rounded-xl py-2 text-sm hover:bg-blue-50 transition-colors"
        >
          ⬇️ Instalar agora
        </button>
      )}
    </div>
  )
}

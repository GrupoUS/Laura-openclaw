// Resilient WebSocket client for OpenClaw gateway
// Uses Bun's native WebSocket — no external `ws` package needed

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

const GATEWAY_WS_URL = process.env.GATEWAY_WS_URL ?? 'ws://127.0.0.1:18789'
const GATEWAY_TIMEOUT_MS = Number(process.env.GATEWAY_TIMEOUT_MS) || 15_000

/* eslint-disable no-console -- intentional server-side logging for gateway diagnostics */
const log = (...args: unknown[]) => console.log('[gateway-ws]', ...args)
const logErr = (...args: unknown[]) => console.error('[gateway-ws]', ...args)
const logWarn = (...args: unknown[]) => console.warn('[gateway-ws]', ...args)
/* eslint-enable no-console */
const RECONNECT_DELAY_MS = 5_000

/** Expose the configured URL for diagnostics */
export function getGatewayUrl(): string {
  return GATEWAY_WS_URL
}

export function getGatewayWs(url = GATEWAY_WS_URL): WebSocket {
  if (
    !ws ||
    ws.readyState === WebSocket.CLOSED ||
    ws.readyState === WebSocket.CLOSING
  ) {
    log(`connecting to ${url}`)
    ws = new WebSocket(url)

    ws.addEventListener('open', () => {
      log(`✓ connected to ${url}`)
    })

    ws.addEventListener('error', (ev) => {
      logErr(`✗ error on ${url}:`, (ev as unknown as { message?: string })?.message ?? 'unknown')
    })

    ws.addEventListener('close', (ev) => {
      logWarn(
        `closed (code=${ev.code}, reason=${ev.reason || 'none'})`
      )
      ws = null
      // Schedule auto-reconnect (single timer guard)
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null
          getGatewayWs(url)
        }, RECONNECT_DELAY_MS)
      }
    })
  }
  return ws
}

export function gatewayCall<T = unknown>(
  tool: string,
  params: Record<string, unknown>,
  gatewayToken: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    let socket: WebSocket

    try {
      socket = getGatewayWs()
    } catch (err) {
      return reject(
        new Error(
          `Failed to create WebSocket to ${GATEWAY_WS_URL}: ${(err as Error).message}`
        )
      )
    }

    const id = crypto.randomUUID()
    const payload = JSON.stringify({ id, tool, params, gatewayToken })

    const cleanup = () => {
      socket.removeEventListener('message', onMessage)
      socket.removeEventListener('error', onError)
      socket.removeEventListener('close', onClose)
      clearTimeout(timer)
    }

    const onMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(
          typeof event.data === 'string' ? event.data : ''
        ) as { id?: string; error?: string; result: T }
        if (msg.id !== id) return
        cleanup()
        if (msg.error) {
          reject(new Error(msg.error))
        } else {
          resolve(msg.result)
        }
      } catch {
        // Skip non-JSON messages
      }
    }

    const onError = () => {
      cleanup()
      reject(
        new Error(
          `WebSocket error while calling "${tool}" (target: ${GATEWAY_WS_URL})`
        )
      )
    }

    const onClose = (ev: CloseEvent) => {
      cleanup()
      reject(
        new Error(
          `WebSocket closed (code=${ev.code}) before "${tool}" replied (target: ${GATEWAY_WS_URL})`
        )
      )
    }

    socket.addEventListener('message', onMessage)
    socket.addEventListener('error', onError)
    socket.addEventListener('close', onClose)

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload)
    } else if (socket.readyState === WebSocket.CONNECTING) {
      socket.addEventListener(
        'open',
        () => {
          // Double-check it's still alive after the open event
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(payload)
          }
        },
        { once: true }
      )
    } else {
      cleanup()
      return reject(
        new Error(
          `WebSocket is ${socket.readyState === WebSocket.CLOSING ? 'closing' : 'closed'} — cannot call "${tool}" (target: ${GATEWAY_WS_URL})`
        )
      )
    }

    // Timeout with diagnostic info
    const timer = setTimeout(() => {
      cleanup()
      reject(
        new Error(
          `Gateway call "${tool}" timed out after ${GATEWAY_TIMEOUT_MS / 1000}s (target: ${GATEWAY_WS_URL}, readyState: ${socket.readyState})`
        )
      )
    }, GATEWAY_TIMEOUT_MS)
  })
}

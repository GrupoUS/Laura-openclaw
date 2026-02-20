// Resilient WebSocket client for OpenClaw gateway
// Implements proper OpenClaw JSON-RPC handshake protocol
// Uses Bun's native WebSocket — no external `ws` package needed

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let handshakeComplete = false
let pendingHandshakeCallbacks: Array<{
  resolve: () => void
  reject: (err: Error) => void
}> = []

const GATEWAY_WS_URL = process.env.GATEWAY_WS_URL ?? 'ws://127.0.0.1:18789'
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN ?? ''
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

/**
 * Send the OpenClaw `connect` handshake frame.
 * The gateway requires this as the first frame on every new WS connection.
 */
function sendConnectHandshake(socket: WebSocket): void {
  const connectFrame = JSON.stringify({
    jsonrpc: '2.0',
    method: 'connect',
    params: {
      auth: { token: GATEWAY_TOKEN },
      client: { type: 'admin', name: 'openclaw-admin' },
    },
    id: crypto.randomUUID(),
  })
  log('sending connect handshake')
  socket.send(connectFrame)
}

export function getGatewayWs(url = GATEWAY_WS_URL): WebSocket {
  if (
    !ws ||
    ws.readyState === WebSocket.CLOSED ||
    ws.readyState === WebSocket.CLOSING
  ) {
    log(`connecting to ${url}`)
    handshakeComplete = false
    pendingHandshakeCallbacks = []
    ws = new WebSocket(url)

    ws.addEventListener('open', () => {
      log(`✓ connected to ${url}`)
      sendConnectHandshake(ws!)
    })

    ws.addEventListener('message', (ev) => {
      if (handshakeComplete) return // handled by per-call listeners
      try {
        const msg = JSON.parse(
          typeof ev.data === 'string' ? ev.data : ''
        ) as { error?: { message?: string }; result?: unknown }
        if (msg.error) {
          logErr('handshake rejected:', msg.error.message ?? msg.error)
          handshakeComplete = false
          for (const cb of pendingHandshakeCallbacks) {
            cb.reject(
              new Error(
                `Gateway handshake rejected: ${msg.error.message ?? JSON.stringify(msg.error)}`
              )
            )
          }
          pendingHandshakeCallbacks = []
          ws?.close()
          return
        }
        // Handshake accepted
        log('✓ handshake complete')
        handshakeComplete = true
        for (const cb of pendingHandshakeCallbacks) {
          cb.resolve()
        }
        pendingHandshakeCallbacks = []
      } catch {
        // Skip non-JSON messages during handshake
      }
    })

    ws.addEventListener('error', (ev) => {
      logErr(
        `✗ error on ${url}:`,
        (ev as unknown as { message?: string })?.message ?? 'unknown'
      )
    })

    ws.addEventListener('close', (ev) => {
      logWarn(`closed (code=${ev.code}, reason=${ev.reason || 'none'})`)
      handshakeComplete = false
      for (const cb of pendingHandshakeCallbacks) {
        cb.reject(
          new Error(`WebSocket closed (code=${ev.code}) during handshake`)
        )
      }
      pendingHandshakeCallbacks = []
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

/**
 * Wait for the connect handshake to complete.
 * Returns immediately if already handshook.
 */
function waitForHandshake(): Promise<void> {
  if (handshakeComplete) return Promise.resolve()
  return new Promise((resolve, reject) => {
    pendingHandshakeCallbacks.push({ resolve, reject })
  })
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

    // Build JSON-RPC 2.0 frame (token is sent via connect handshake, not per-call)
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      method: tool,
      params,
      id,
    })

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
        ) as { id?: string; error?: { message?: string } | string; result: T }
        if (msg.id !== id) return
        cleanup()
        if (msg.error) {
          const errMsg =
            typeof msg.error === 'string'
              ? msg.error
              : msg.error?.message ?? JSON.stringify(msg.error)
          reject(new Error(errMsg))
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

    // Wait for handshake before sending RPC
    const sendPayload = () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload)
      }
    }

    if (socket.readyState === WebSocket.OPEN && handshakeComplete) {
      sendPayload()
    } else {
      // Wait for connection + handshake
      waitForHandshake()
        .then(sendPayload)
        .catch((err) => {
          cleanup()
          reject(err)
        })
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

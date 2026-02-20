// Uses Bun's native WebSocket — no external `ws` package needed

let ws: WebSocket | null = null

const GATEWAY_WS_URL = process.env.GATEWAY_WS_URL ?? 'ws://127.0.0.1:18789'

export function getGatewayWs(url = GATEWAY_WS_URL): WebSocket {
  if (!ws || ws.readyState > WebSocket.OPEN) {
    ws = new WebSocket(url)
  }
  return ws
}

export function gatewayCall<T = any>(
  tool: string,
  params: Record<string, unknown>,
  gatewayToken: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const socket = getGatewayWs()
    const id = crypto.randomUUID()
    const payload = JSON.stringify({ id, tool, params, gatewayToken })

    const handler = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(typeof event.data === 'string' ? event.data : '')
        if (msg.id !== id) return
        socket.removeEventListener('message', handler)
        msg.error ? reject(new Error(msg.error)) : resolve(msg.result)
      } catch {
        // Skip non-JSON messages
      }
    }

    socket.addEventListener('message', handler)

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload)
    } else if (socket.readyState === WebSocket.CONNECTING) {
      socket.addEventListener('open', () => socket.send(payload), { once: true })
    } else {
      socket.removeEventListener('message', handler)
      return reject(new Error('WebSocket is not open'))
    }

    // Timeout
    setTimeout(() => {
      socket.removeEventListener('message', handler)
      reject(new Error('gateway call timeout'))
    }, 10000)
  })
}

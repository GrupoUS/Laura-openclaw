import { WebSocket } from 'ws'

let ws: WebSocket | null = null

export function getGatewayWs(url = 'ws://127.0.0.1:18789') {
  if (!ws || ws.readyState > 1) {
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

    const handler = (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString())
        if (msg.id !== id) return
        socket.off('message', handler)
        msg.error ? reject(new Error(msg.error)) : resolve(msg.result)
      } catch (err) {
        // Skip non-JSON messages if any, or log them
      }
    }

    socket.on('message', handler)

    // Ensure the socket is open before sending
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload)
    } else if (socket.readyState === WebSocket.CONNECTING) {
      socket.once('open', () => socket.send(payload))
    } else {
      socket.off('message', handler)
      return reject(new Error('WebSocket is not open'))
    }

    // Timeout
    setTimeout(() => {
      socket.off('message', handler)
      reject(new Error('timeout'))
    }, 10000)
  })
}

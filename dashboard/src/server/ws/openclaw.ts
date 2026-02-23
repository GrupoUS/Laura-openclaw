// Resilient WebSocket client for OpenClaw gateway
// Implements full device auth with Ed25519 nonce signing
// Uses Bun's native WebSocket + crypto

import { sign, createPrivateKey } from 'node:crypto'

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let connectingTimer: ReturnType<typeof setTimeout> | null = null
let handshakeComplete = false
let connectFrameId: string | null = null
let challengeNonce: string | null = null
let pendingHandshakeCallbacks: Array<{
  resolve: () => void
  reject: (err: Error) => void
}> = []

const GATEWAY_WS_URL = process.env.GATEWAY_WS_URL ?? 'ws://127.0.0.1:3333'
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN ?? ''
const GATEWAY_TIMEOUT_MS = Number(process.env.GATEWAY_TIMEOUT_MS) || 15_000

// Device identity for operator.admin scope (from env vars)
const DEVICE_ID = process.env.DEVICE_ID ?? ''
const DEVICE_PUBLIC_KEY =
  process.env.DEVICE_PUBLIC_KEY?.replace(/\\n/g, '\n') ?? ''
const DEVICE_PRIVATE_KEY =
  process.env.DEVICE_PRIVATE_KEY?.replace(/\\n/g, '\n') ?? ''

/* eslint-disable no-console -- intentional server-side logging for gateway diagnostics */
const log = (...args: unknown[]) => console.log('[gateway-ws]', ...args)
const logErr = (...args: unknown[]) => console.error('[gateway-ws]', ...args)
const logWarn = (...args: unknown[]) => console.warn('[gateway-ws]', ...args)
/* eslint-enable no-console */
const RECONNECT_DELAY_MS = 5_000
const CONNECTING_TIMEOUT_MS = 10_000
const PROTOCOL_VERSION = 3

/** Expose the configured URL for diagnostics */
export function getGatewayUrl(): string {
  return GATEWAY_WS_URL
}

/** Check whether the gateway WebSocket is connected and handshake is done */
export function isGatewayConnected(): boolean {
  return ws !== null && ws.readyState === WebSocket.OPEN && handshakeComplete
}

/**
 * Build the device auth payload string for Ed25519 signing.
 * Format: v2|deviceId|clientId|clientMode|role|scopes|signedAtMs|token|nonce
 */
function buildDeviceAuthPayload(params: {
  deviceId: string
  clientId: string
  clientMode: string
  role: string
  scopes: string[]
  signedAtMs: number
  token: string
  nonce: string
}): string {
  return [
    'v2',
    params.deviceId,
    params.clientId,
    params.clientMode,
    params.role,
    params.scopes.join(','),
    String(params.signedAtMs),
    params.token,
    params.nonce,
  ].join('|')
}

/**
 * Sign a payload with the device's Ed25519 private key.
 * Returns base64url-encoded signature.
 */
function signPayload(payload: string): string {
  const key = createPrivateKey(DEVICE_PRIVATE_KEY)
  const sig = sign(null, Buffer.from(payload), key)
  return sig.toString('base64url')
}

/**
 * Extract raw Ed25519 public key as base64url (32 bytes only, no SPKI wrapper).
 * The gateway expects raw key bytes for device ID derivation.
 */
function publicKeyBase64Url(): string {
  const { createPublicKey } = require('node:crypto')
  const pubKey = createPublicKey(DEVICE_PUBLIC_KEY)
  const jwk = pubKey.export({ format: 'jwk' }) as { x?: string }
  // JWK 'x' is already base64url for Ed25519
  return jwk.x ?? ''
}

/**
 * Send the OpenClaw `connect` handshake frame with device auth.
 * Must be called after receiving the connect.challenge nonce.
 */
function sendConnectWithDevice(socket: WebSocket, nonce: string): void {
  connectFrameId = crypto.randomUUID()
  const signedAtMs = Date.now()
  const scopes = ['operator.admin']

  const payload = buildDeviceAuthPayload({
    deviceId: DEVICE_ID,
    clientId: 'gateway-client',
    clientMode: 'backend',
    role: 'operator',
    scopes,
    signedAtMs,
    token: GATEWAY_TOKEN,
    nonce,
  })

  const signature = signPayload(payload)

  const connectFrame = JSON.stringify({
    type: 'req',
    method: 'connect',
    id: connectFrameId,
    params: {
      minProtocol: PROTOCOL_VERSION,
      maxProtocol: PROTOCOL_VERSION,
      client: {
        id: 'gateway-client',
        version: '1.0.0',
        platform: 'railway',
        mode: 'backend',
      },
      auth: { token: GATEWAY_TOKEN },
      scopes,
      device: {
        id: DEVICE_ID,
        publicKey: publicKeyBase64Url(),
        signature,
        signedAt: signedAtMs,
        nonce,
      },
    },
  })
  log('sending connect handshake with device auth')
  socket.send(connectFrame)
}

/**
 * Send a simple connect handshake without device auth (fallback).
 */
function sendConnectSimple(socket: WebSocket): void {
  connectFrameId = crypto.randomUUID()
  const connectFrame = JSON.stringify({
    type: 'req',
    method: 'connect',
    id: connectFrameId,
    params: {
      minProtocol: PROTOCOL_VERSION,
      maxProtocol: PROTOCOL_VERSION,
      client: {
        id: 'gateway-client',
        version: '1.0.0',
        platform: 'railway',
        mode: 'backend',
      },
      auth: { token: GATEWAY_TOKEN },
    },
  })
  log('sending connect handshake (simple, no device)')
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
    connectFrameId = null
    challengeNonce = null
    pendingHandshakeCallbacks = []
    ws = new WebSocket(url)

    // Guard: if socket stays in CONNECTING for too long, force close & reconnect
    connectingTimer = setTimeout(() => {
      connectingTimer = null
      if (ws && ws.readyState === WebSocket.CONNECTING) {
        logWarn(`CONNECTING timeout after ${CONNECTING_TIMEOUT_MS / 1000}s — forcing close`)
        ws.close()
      }
    }, CONNECTING_TIMEOUT_MS)

    ws.addEventListener('open', () => {
      if (connectingTimer) { clearTimeout(connectingTimer); connectingTimer = null }
      log(`✓ connected to ${url}`)
      // Don't send connect yet — wait for connect.challenge event
    })

    // Global message handler — handles challenge + connect response
    ws.addEventListener('message', (ev) => {
      try {
        const raw = typeof ev.data === 'string' ? ev.data : ''
        const msg = JSON.parse(raw) as {
          type?: string
          id?: string
          ok?: boolean
          event?: string
          payload?: { nonce?: string }
          error?: { code?: number; message?: string } | string
          result?: unknown
        }

        // Handle connect.challenge event
        if (
          msg.type === 'event' &&
          msg.event === 'connect.challenge' &&
          msg.payload?.nonce
        ) {
          challengeNonce = msg.payload.nonce
          log(`received challenge nonce: ${challengeNonce.slice(0, 8)}...`)

          // ws is guaranteed non-null inside its own event listener
          const socket = ws
          if (!socket) return

          // If device identity is configured, use device auth
          if (DEVICE_ID && DEVICE_PRIVATE_KEY) {
            try {
              sendConnectWithDevice(socket, challengeNonce)
            } catch (err) {
              logErr('device auth failed, falling back to simple auth:', (err as Error).message)
              sendConnectSimple(socket)
            }
          } else {
            sendConnectSimple(socket)
          }
          return
        }

        // Only process connect response after handshake init
        if (handshakeComplete) return // handled by per-call listeners
        if (msg.type !== 'res' || msg.id !== connectFrameId) return

        if (msg.ok === false || msg.error) {
          const errMsg = msg.error
            ? typeof msg.error === 'string'
              ? msg.error
              : (msg.error as { message?: string }).message ??
                JSON.stringify(msg.error)
            : 'connect rejected (ok=false)'
          logErr('handshake rejected:', errMsg)
          for (const cb of pendingHandshakeCallbacks) {
            cb.reject(new Error(`Gateway handshake rejected: ${errMsg}`))
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
        // Skip non-JSON messages
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
      if (connectingTimer) { clearTimeout(connectingTimer); connectingTimer = null }
      handshakeComplete = false
      connectFrameId = null
      challengeNonce = null
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
  _gatewayToken: string
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
    const payload = JSON.stringify({
      type: 'req',
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
        ) as {
          id?: string
          type?: string
          ok?: boolean
          error?: { code?: number; message?: string } | string
          result: T
        }
        if (msg.id !== id) return
        cleanup()
        if (msg.ok === false || msg.error) {
          const errMsg = msg.error
            ? typeof msg.error === 'string'
              ? msg.error
              : (msg.error as { message?: string })?.message ??
                JSON.stringify(msg.error)
            : 'request failed (ok=false)'
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

    const sendPayload = () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload)
      }
    }

    if (socket.readyState === WebSocket.OPEN && handshakeComplete) {
      sendPayload()
    } else {
      waitForHandshake()
        .then(sendPayload)
        .catch((err) => {
          cleanup()
          reject(err)
        })
    }

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

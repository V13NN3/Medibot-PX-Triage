export interface SignalMessage {
  type: string
  callId?: string
  doctorId?: string
  patientName?: string
  sdp?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
}

export interface SignalHandlers {
  onOpen?: () => void
  onClose?: () => void
  onError?: (err: Event) => void
  onMessage?: (msg: SignalMessage) => void
}

export class SignalClient {
  private ws: WebSocket | null = null
  private url: string
  private doctorId = ""
  private name = ""
  private handlers: SignalHandlers
  private shouldReconnect = false
  private hasConnected = false
  private reconnectDelay = 1000
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  constructor(url: string, handlers: SignalHandlers = {}) {
    this.url = url
    this.handlers = handlers
  }

  connect(doctorId: string, name: string) {
    this.doctorId = doctorId
    this.name = name
    this.shouldReconnect = true
    this.hasConnected = false
    this.open()
  }

  private open() {
    if (!this.url) {
      this.handlers.onError?.(new Event("error"))
      return
    }
    const ws = new WebSocket(this.url)
    this.ws = ws

    const connectTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.warn("[signal] connection timeout, closing")
        ws.close()
      }
    }, 8000)

    ws.onopen = () => {
      clearTimeout(connectTimeout)
      this.hasConnected = true
      this.reconnectDelay = 1000
      ws.send(JSON.stringify({ type: "register", doctorId: this.doctorId, name: this.name }))
      this.handlers.onOpen?.()
    }

    ws.onmessage = (e) => {
      try {
        this.handlers.onMessage?.(JSON.parse((e as MessageEvent).data))
      } catch {
        /* ignore */
      }
    }

    ws.onclose = () => {
      clearTimeout(connectTimeout)
      this.handlers.onClose?.()
      if (this.shouldReconnect && this.hasConnected) {
        this.reconnectTimer = setTimeout(() => this.open(), this.reconnectDelay)
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 15000)
      }
    }

    ws.onerror = (err) => {
      clearTimeout(connectTimeout)
      this.handlers.onError?.(err)
    }
  }

  send(msg: SignalMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
      return true
    }
    return false
  }

  get isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  disconnect() {
    this.shouldReconnect = false
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.reconnectTimer = null
    this.ws?.close()
    this.ws = null
  }
}
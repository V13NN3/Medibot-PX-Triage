"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { SignalClient, type SignalMessage } from "@/lib/signal-client"

type Presence = "idle" | "connecting" | "online" | "reconnecting" | "offline"
type CallState = "none" | "incoming" | "connecting" | "connected"

export default function TelehealthPage() {
  const [doctor, setDoctor] = useState<{ id: string; name: string } | null>(null)
  const [presence, setPresence] = useState<Presence>("idle")
  const [callState, setCallState] = useState<CallState>("none")
  const [callerName, setCallerName] = useState("")
  const [error, setError] = useState("")
  const [muted, setMuted] = useState(false)
  const [camOn, setCamOn] = useState(true)

  const clientRef = useRef<SignalClient | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const callIdRef = useRef("")
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const doctorRef = useRef<{ id: string; name: string } | null>(null)

  const SIGNAL_URL = process.env.NEXT_PUBLIC_SIGNAL_URL || ""

  const cleanupCall = useCallback(() => {
    pcRef.current?.close()
    pcRef.current = null
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    callIdRef.current = ""
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
  }, [])

  const loadDoctor = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: session, error: authErr } = await Promise.race([
        supabase.auth.getUser(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("auth timeout")), 5000)),
      ])
      if (authErr || !session?.user) {
        console.warn("[telehealth] no auth session:", authErr?.message ?? "no user")
        return
      }
      const { data: account } = await supabase
        .from("doctor_accounts")
        .select("doctor_id, name")
        .eq("user_id", session.user.id)
        .single()
      if (account) {
        const d = { id: account.doctor_id, name: account.name }
        setDoctor(d)
        doctorRef.current = d
      }
    } catch (err) {
      console.warn("[telehealth] loadDoctor failed:", err)
    }
  }, [])

  useEffect(() => {
    loadDoctor()
    return () => {
      clientRef.current?.disconnect()
      clientRef.current = null
      cleanupCall()
    }
  }, [loadDoctor, cleanupCall])

  const setupMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true,
    })
    localStreamRef.current = stream
    if (localVideoRef.current) localVideoRef.current.srcObject = stream
    return stream
  }

  const endCall = () => {
    clientRef.current?.send({ type: "end-call", callId: callIdRef.current })
    cleanupCall()
    setCallState("none")
  }

  const createPeer = async (stream: MediaStream) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] })
    pcRef.current = pc
    stream.getTracks().forEach((track) => pc.addTrack(track, stream))
    pc.onicecandidate = (ev) => {
      if (ev.candidate && clientRef.current) {
        clientRef.current.send({ type: "ice", callId: callIdRef.current, candidate: ev.candidate.toJSON() })
      }
    }
    pc.ontrack = (ev) => {
      if (remoteVideoRef.current && ev.streams[0]) {
        remoteVideoRef.current.srcObject = ev.streams[0]
      }
    }
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        endCall()
      }
    }
    return pc
  }

  const goAvailable = async () => {
    if (!doctorRef.current) {
      await loadDoctor()
    }
    if (!doctorRef.current) {
      setError("Could not load your doctor profile. Make sure you are logged in.")
      return
    }
    if (!SIGNAL_URL) {
      setError("NEXT_PUBLIC_SIGNAL_URL is not set. Check your .env.local")
      return
    }
    const doc = doctorRef.current
    setError("")
    setPresence("connecting")
    console.log("[telehealth] connecting to signal:", SIGNAL_URL, "as", doc.name)

    const client = new SignalClient(SIGNAL_URL, {
      onOpen: () => setPresence("online"),
      onClose: () => setPresence((p) => (p === "online" ? "reconnecting" : p)),
      onError: (err) => {
        console.error("[telehealth] signal error:", err)
        client.disconnect()
        clientRef.current = null
        setError("Cannot reach the signal server. Check that the kiosk is running and the URL is correct.")
        setPresence("idle")
      },
      onMessage: async (msg) => {
        if (msg.type === "incoming-call") {
          callIdRef.current = msg.callId || ""
          setCallerName(msg.patientName || "Patient")
          setCallState("incoming")
        }
        if (msg.type === "call-cancelled") {
          cleanupCall()
          setCallState("none")
        }
        if (msg.type === "offer") {
          callIdRef.current = msg.callId || ""
          try {
            setCallState("connected")
            const stream = await setupMedia()
            const pc = await createPeer(stream)
            await pc.setRemoteDescription(msg.sdp!)
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            client.send({ type: "answer", callId: callIdRef.current, sdp: pc.localDescription! })
          } catch {
            setError("Could not start the call (camera/mic unavailable)")
            endCall()
          }
        }
        if (msg.type === "ice" && pcRef.current && msg.candidate) {
          try {
            await pcRef.current.addIceCandidate(msg.candidate)
          } catch {
            /* ignore */
          }
        }
        if (msg.type === "peer-ended") {
          cleanupCall()
          setCallState("none")
        }
      },
    })

    clientRef.current = client
    client.connect(doc.id, doc.name)
  }

  const goOffline = () => {
    clientRef.current?.disconnect()
    clientRef.current = null
    cleanupCall()
    setPresence("idle")
    setCallState("none")
  }

  const acceptCall = async () => {
    if (!clientRef.current) return
    setError("")
    setCallState("connecting")
    clientRef.current.send({ type: "accept", callId: callIdRef.current })
  }

  const declineCall = () => {
    clientRef.current?.send({ type: "decline", callId: callIdRef.current })
    cleanupCall()
    setCallState("none")
  }

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next))
  }

  const toggleCam = () => {
    const next = !camOn
    setCamOn(next)
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next))
  }

  const isOnline = presence === "online"

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Telehealth</h1>
        <p className="text-sm text-gray-500">Go available to receive video calls from patients</p>
      </div>

      {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2">{error}</p>}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-foreground">{doctor?.name || "Loading..."}</p>
            <p className="text-xs text-gray-500">Presence</p>
          </div>
          <span className={`flex items-center gap-1.5 text-xs font-semibold ${
            isOnline ? "text-success" : presence === "reconnecting" ? "text-amber-500" : "text-gray-400"
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isOnline ? "bg-success" : presence === "reconnecting" ? "bg-amber-500" : "bg-gray-300"
            } animate-pulse`} />
            {isOnline ? "Available" : presence === "reconnecting" ? "Reconnecting..." : "Offline"}
          </span>
        </div>

        {!isOnline && (
          <button onClick={goAvailable} disabled={presence === "connecting"}
            className="w-full py-3 rounded-xl bg-success text-white font-semibold hover:bg-green-600 transition-colors disabled:bg-gray-300">
            {presence === "connecting" ? "Connecting..." : "Go Available"}
          </button>
        )}
        {isOnline && (
          <button onClick={goOffline}
            className="w-full py-3 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
            Go Offline
          </button>
        )}
        {!SIGNAL_URL && <p className="text-xs text-amber-600">Set NEXT_PUBLIC_SIGNAL_URL to enable telehealth.</p>}
      </div>

      {callState === "incoming" && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 flex flex-col items-center gap-4 text-center">
          <span className="text-5xl animate-pulse">📞</span>
          <p className="text-lg font-semibold text-foreground">Incoming call</p>
          <p className="text-sm text-gray-500">{callerName} is calling</p>
          <div className="flex gap-3">
            <button onClick={acceptCall}
              className="px-6 py-3 rounded-xl bg-success text-white font-bold hover:bg-green-600 transition-colors">
              Accept
            </button>
            <button onClick={declineCall}
              className="px-6 py-3 rounded-xl bg-danger text-white font-bold hover:bg-red-600 transition-colors">
              Decline
            </button>
          </div>
        </div>
      )}

      {callState === "connecting" && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 flex flex-col items-center gap-3 text-center">
          <span className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-foreground">Connecting to {callerName || "patient"}...</p>
        </div>
      )}

      {callState === "connected" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-foreground">In call with {callerName || "Patient"}</p>
            <button onClick={endCall}
              className="px-5 py-2.5 rounded-xl bg-danger text-white text-sm font-bold hover:bg-red-600 transition-colors">
              End Call
            </button>
          </div>
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
            <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-contain" />
            <div className="absolute bottom-3 left-3 w-36 h-24 rounded-xl overflow-hidden border border-white/30 shadow-lg">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
            <div className="absolute top-3 right-3 flex gap-2">
              <button onClick={toggleMute}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur text-white text-lg hover:bg-white/30 transition-colors">
                {muted ? "🔇" : "🎙️"}
              </button>
              <button onClick={toggleCam}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur text-white text-lg hover:bg-white/30 transition-colors">
                {camOn ? "🎥" : "🚫"}
              </button>
            </div>
          </div>
        </div>
      )}

      {callState === "none" && !isOnline && (
        <div className="text-center py-8 text-sm text-gray-400">
          When you go available, patients will be able to call you from the clinic kiosk.
        </div>
      )}
    </div>
  )
}
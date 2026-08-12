"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"

interface Ticket {
  id: string
  ticket_number: number
  formatted_number: string
  patient_name: string
  doctor_id: string | null
  created_at: string
}

interface LastCalled {
  id: string
  formatted_number: string
  patient_name: string
  doctor_id: string | null
}

export default function QueuePage() {
  const [waiting, setWaiting] = useState<Ticket[]>([])
  const [walkIns, setWalkIns] = useState<Ticket[]>([])
  const [myPatients, setMyPatients] = useState<Ticket[]>([])
  const [nextTicket, setNextTicket] = useState<Ticket | null>(null)
  const [lastCalled, setLastCalled] = useState<LastCalled | null>(null)
  const [doctorId, setDoctorId] = useState("")
  const [doctorName, setDoctorName] = useState("")
  const [loading, setLoading] = useState("")
  const [claimName, setClaimName] = useState("")
  const [history, setHistory] = useState<{ formatted: string; patient: string; time: string }[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: accounts } = await supabase
        .from("doctor_accounts")
        .select("doctor_id, name")
        .eq("user_id", user.id)
        .single()
      if (accounts) {
        setDoctorId(accounts.doctor_id)
        setDoctorName(accounts.name)
      }
    })
  }, [])

  const fetchQueue = async () => {
    if (!doctorId) return
    try {
      const res = await fetch(`/api/queue/serving?doctor_id=${doctorId}`)
      const data = await res.json()
      setWaiting(data.waiting || [])
      setWalkIns(data.walkIns || [])
      setMyPatients(data.myPatients || [])
      setNextTicket(data.nextTicket)
      setLastCalled(data.lastCalled)
    } catch {}
  }

  useEffect(() => {
    if (!doctorId) return
    fetchQueue()
    const interval = setInterval(fetchQueue, 3000)
    return () => clearInterval(interval)
  }, [doctorId])

  const callNext = async () => {
    if (!nextTicket) return
    setLoading("call")
    try {
      const res = await fetch("/api/queue/serving", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_id: doctorId }),
      })
      const data = await res.json()
      if (data.formatted) {
        setHistory((prev) => [
          { formatted: data.formatted, patient: data.patientName, time: new Date().toLocaleTimeString() },
          ...prev.slice(0, 19),
        ])
        await fetchQueue()
      }
    } catch {}
    setLoading("")
  }

  const recall = async () => {
    if (!lastCalled) return
    setLoading("recall")
    try {
      const res = await fetch("/api/queue/recall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_id: doctorId }),
      })
      if (res.ok) await fetchQueue()
    } catch {}
    setLoading("")
  }

  const undo = async () => {
    if (!lastCalled) return
    setLoading("undo")
    try {
      const res = await fetch("/api/queue/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_id: doctorId }),
      })
      if (res.ok) {
        setClaimName("")
        await fetchQueue()
      }
    } catch {}
    setLoading("")
  }

  const claim = async () => {
    if (!lastCalled) return
    setLoading("claim")
    try {
      const res = await fetch("/api/queue/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: lastCalled.id,
          doctor_id: doctorId,
          patient_name: claimName || undefined,
        }),
      })
      if (res.ok) {
        setClaimName("")
        await fetchQueue()
      }
    } catch {}
    setLoading("")
  }

  const isUnknown = (name: string) => !name || name === "Unknown"
  const canGet = lastCalled && (!lastCalled.doctor_id || lastCalled.doctor_id !== doctorId || isUnknown(lastCalled.patient_name))

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Queue Management</h1>
        <p className="text-sm text-gray-500">
          {doctorName ? `Queue for ${doctorName}` : "Manage patient queue"}
        </p>
      </div>

      {lastCalled && (
        <div className="bg-teal/5 border border-teal/20 rounded-2xl p-5 text-center">
          <p className="text-xs text-teal uppercase tracking-wider font-medium">Last Called</p>
          <p className="text-3xl font-bold text-teal tabular-nums mt-1">{lastCalled.formatted_number}</p>
          <p className="text-sm text-gray-500 mt-1">
            {isUnknown(lastCalled.patient_name) ? "Unknown patient" : lastCalled.patient_name}
            {!lastCalled.doctor_id && <span className="text-amber-600 dark:text-amber-400"> · Walk-in (unassigned)</span>}
            {lastCalled.doctor_id && lastCalled.doctor_id !== doctorId && <span> · another doctor&apos;s patient</span>}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <button onClick={recall} disabled={!!loading}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                loading ? "bg-gray-300 cursor-not-allowed" : "bg-primary text-white hover:bg-primary-dark"
              }`}>
              {loading === "recall" ? "Re-calling..." : "Re-call"}
            </button>
            <button onClick={undo} disabled={!!loading}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                loading ? "bg-gray-300 cursor-not-allowed" : "bg-danger/10 text-danger hover:bg-danger/20"
              }`}>
              {loading === "undo" ? "Undoing..." : "Undo Call"}
            </button>
          </div>

          {canGet && (
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-2 justify-center">
              {isUnknown(lastCalled.patient_name) && (
                <input
                  type="text"
                  value={claimName}
                  onChange={(e) => setClaimName(e.target.value)}
                  placeholder="Patient name (optional)"
                  maxLength={100}
                  className="w-full sm:w-56 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                />
              )}
              <button onClick={claim} disabled={!!loading}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors w-full sm:w-auto ${
                  loading ? "bg-gray-300 cursor-not-allowed" : "bg-teal text-white hover:bg-teal-dark"
                }`}>
                {loading === "claim" ? "Getting..." : "Get This Patient"}
              </button>
            </div>
          )}
        </div>
      )}

      {myPatients.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Patients ({myPatients.length})</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {myPatients.map((t) => (
              <div key={t.id} className="px-5 py-3 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center shrink-0">
                  {t.patient_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{t.patient_name}</p>
                  <p className="text-xs text-gray-500">Ticket {t.formatted_number}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(t.created_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {walkIns.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-amber-200 dark:border-amber-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-100 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Walk-in Patients ({walkIns.length})</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {walkIns.map((t) => (
              <div key={t.id} className="px-5 py-3 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-semibold flex items-center justify-center shrink-0">
                  {t.patient_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{t.patient_name}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">Walk-in · Ticket {t.formatted_number}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(t.created_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {waiting.length === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-5 py-8 text-center text-sm text-gray-400">
          No patients waiting
        </div>
      )}

      <button onClick={callNext} disabled={!!loading || !nextTicket}
        className={`w-full py-6 rounded-2xl text-white text-xl font-bold tracking-wider transition-all active:scale-[0.98] ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : nextTicket
              ? "bg-teal hover:bg-teal-dark shadow-lg shadow-teal/30"
              : "bg-gray-300 cursor-not-allowed"
        }`}>
        {loading === "call"
          ? "Calling..."
          : nextTicket
            ? `NEXT → ${nextTicket.patient_name} (${nextTicket.formatted_number})`
            : "No patients waiting"}
      </button>

      {history.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Call History</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {history.map((h, i) => (
              <div key={i} className="px-5 py-2.5 flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{h.formatted} — {h.patient}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

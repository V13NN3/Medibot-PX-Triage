"use client"

import { useState, useEffect } from "react"

export default function QueuePage() {
  const [serving, setServing] = useState("A-000")
  const [currentNumber, setCurrentNumber] = useState(0)
  const [nowServing, setNowServing] = useState(0)
  const [history, setHistory] = useState<{ formatted: string; time: string }[]>([])
  const [loading, setLoading] = useState(false)

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/queue/serving")
      const data = await res.json()
      setServing(data.formatted || "A-000")
      setCurrentNumber(data.currentNumber || 0)
      setNowServing(data.nowServing || 0)
    } catch {}
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 3000)
    return () => clearInterval(interval)
  }, [])

  const nextServing = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/queue/serving", { method: "POST" })
      const data = await res.json()
      if (data.formatted) {
        setServing(data.formatted)
        setNowServing(data.nowServing)
        setHistory((prev) => [
          { formatted: data.formatted, time: new Date().toLocaleTimeString() },
          ...prev.slice(0, 19),
        ])
      }
    } catch {}
    setLoading(false)
  }

  const waiting = currentNumber - nowServing

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Queue Management</h1>
        <p className="text-sm text-gray-500">Manage patient queue and call next patient</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Now Serving</p>
          <p className="text-4xl font-bold text-teal tabular-nums mt-1">{serving}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Waiting</p>
          <p className="text-4xl font-bold text-foreground tabular-nums mt-1">{Math.max(0, waiting)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Last Number</p>
          <p className="text-4xl font-bold text-primary tabular-nums mt-1">A-{String(currentNumber).padStart(3, "0")}</p>
        </div>
      </div>

      <button onClick={nextServing} disabled={loading || waiting <= 0}
        className={`w-full py-6 rounded-2xl text-white text-xl font-bold tracking-wider transition-all active:scale-[0.98] ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : waiting > 0
              ? "bg-teal hover:bg-teal-dark shadow-lg shadow-teal/30"
              : "bg-gray-300 cursor-not-allowed"
        }`}>
        {loading ? "Calling..." : waiting > 0 ? `NEXT → A-${String(nowServing + 1).padStart(3, "0")}` : "No patients waiting"}
      </button>

      {history.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Call History</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {history.map((h, i) => (
              <div key={i} className="px-5 py-2.5 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{h.formatted}</span>
                <span className="text-xs text-gray-400">{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

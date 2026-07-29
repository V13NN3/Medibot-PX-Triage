"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"

export default function DashboardPage() {
  const [serving, setServing] = useState("A-000")
  const [nextNum, setNextNum] = useState(0)
  const [patientCount, setPatientCount] = useState(0)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/queue/serving")
        const data = await res.json()
        setServing(data.formatted || "A-000")
        setNextNum(data.nextNumber || 0)
      } catch {}
      try {
        const supabase = createClient()
        const { count } = await supabase.from("patients").select("*", { count: "exact", head: true })
        setPatientCount(count || 0)
      } catch {}
    }
    fetchStats()
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of today&apos;s queue and patients</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Now Serving</p>
          <p className="text-3xl font-bold text-primary tabular-nums">{serving}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Next Number</p>
          <p className="text-3xl font-bold text-teal tabular-nums">A-{String(nextNum).padStart(3, "0")}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Patients</p>
          <p className="text-3xl font-bold text-foreground tabular-nums">{patientCount}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <h2 className="text-sm font-semibold text-foreground mb-2">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <a href="/dashboard/queue"
            className="flex items-center gap-3 rounded-xl bg-primary/5 p-4 hover:bg-primary/10 transition-colors">
            <span className="text-2xl">🎫</span>
            <div>
              <p className="text-sm font-medium text-foreground">Manage Queue</p>
              <p className="text-xs text-gray-500">Next patient &amp; history</p>
            </div>
          </a>
          <a href="/dashboard/patients"
            className="flex items-center gap-3 rounded-xl bg-teal/5 p-4 hover:bg-teal/10 transition-colors">
            <span className="text-2xl">🧑‍⚕️</span>
            <div>
              <p className="text-sm font-medium text-foreground">Patients</p>
              <p className="text-xs text-gray-500">Search records &amp; visits</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}

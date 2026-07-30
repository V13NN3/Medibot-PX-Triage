"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const HOURS = Array.from({ length: 10 }, (_, i) => `${i + 8}:00`)

interface Slot {
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
}

export default function SchedulePage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [doctorId, setDoctorId] = useState("")
  const [doctorName, setDoctorName] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: account } = await supabase
        .from("doctor_accounts")
        .select("doctor_id, name")
        .eq("user_id", user.id)
        .single()
      if (account) {
        setDoctorId(account.doctor_id)
        setDoctorName(account.name)
        const res = await fetch(`/api/schedule?doctor_id=${account.doctor_id}`)
        const data = await res.json()
        if (data.slots) setSlots(data.slots)
      }
      setLoading(false)
    })
  }, [])

  const toggleSlot = (day: number, hour: string) => {
    setSlots((prev) => {
      const existing = prev.find((s) => s.day_of_week === day && s.start_time === hour)
      if (existing) return prev.filter((s) => s !== existing)
      return [...prev, { day_of_week: day, start_time: hour, end_time: `${parseInt(hour) + 1}:00`, is_available: true }]
    })
  }

  const isActive = (day: number, hour: string) => {
    return slots.some((s) => s.day_of_week === day && s.start_time === hour)
  }

  const saveSchedule = async () => {
    if (!doctorId) return
    setSaving(true)
    try {
      await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_id: doctorId, slots }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
    setSaving(false)
  }

  if (loading) return <p className="text-sm text-gray-400 text-center py-8">Loading...</p>

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Schedule Availability</h1>
        <p className="text-sm text-gray-500">
          {doctorName ? `Set your weekly available hours — ${doctorName}` : "Set your weekly available hours"}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Weekly Hours (tap to toggle)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase">
                <th className="px-3 py-2 font-medium w-16"></th>
                {DAYS.map((d) => (
                  <th key={d} className="px-3 py-2 font-medium text-center">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => (
                <tr key={hour} className="border-t border-gray-50 dark:border-gray-800/60">
                  <td className="px-3 py-1.5 text-xs text-gray-400">{hour}</td>
                  {DAYS.map((_, day) => (
                    <td key={day} className="px-1 py-1 text-center">
                      <button onClick={() => toggleSlot(day, hour)}
                        className={`w-full py-2 rounded-lg text-xs font-medium transition-colors ${
                          isActive(day, hour)
                            ? "bg-teal text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}>
                        {isActive(day, hour) ? "✓" : ""}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button onClick={saveSchedule} disabled={saving || !doctorId}
        className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:bg-gray-300">
        {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Schedule"}
      </button>
    </div>
  )
}

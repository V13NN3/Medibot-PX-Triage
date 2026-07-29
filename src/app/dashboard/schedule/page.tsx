"use client"

import { useState, useEffect } from "react"

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
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/doctors/search?q=")
      .then((r) => r.json())
      .then((data) => setDoctors(data.doctors || []))
  }, [])

  const toggleSlot = (day: number, hour: string) => {
    setSlots((prev) => {
      const existing = prev.find((s) => s.day_of_week === day && s.start_time === hour)
      if (existing) {
        return prev.filter((s) => s !== existing)
      }
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

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Schedule Availability</h1>
        <p className="text-sm text-gray-500">Set your weekly available hours</p>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Select Doctor</label>
        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
          <option value="">Choose your name...</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
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

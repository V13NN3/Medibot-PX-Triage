"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Patient {
  id: string
  name: string
  dob: string
  sex: string
}

export default function PatientsPage() {
  const [query, setQuery] = useState("")
  const [patients, setPatients] = useState<Patient[]>([])
  const [allPatients, setAllPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/patients/search?q=")
      .then((r) => r.json())
      .then((data) => {
        setAllPatients(data.patients || [])
        setPatients(data.patients || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSearch = (q: string) => {
    setQuery(q)
    if (q.length < 2) {
      setPatients(allPatients)
      return
    }
    setLoading(true)
    fetch(`/api/patients/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => setPatients(data.patients || []))
      .catch(() => setPatients(allPatients))
      .finally(() => setLoading(false))
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Patients</h1>
        <p className="text-sm text-gray-500">All patient records ({allPatients.length} total)</p>
      </div>

      <input type="search" value={query} placeholder="Filter by name..."
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm shadow-sm" />

      {loading && <p className="text-sm text-gray-400 text-center py-4">Loading...</p>}

      {!loading && patients.length > 0 && (
        <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
          {patients.map((p) => (
            <Link key={p.id} href={`/dashboard/patients/${p.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <span className="w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center shrink-0">
                {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                <p className="text-xs text-gray-500">{p.sex} &middot; DOB: {p.dob?.slice(0, 10)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && patients.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          {query ? `No patients matching "${query}"` : "No patient records found"}
        </p>
      )}
    </div>
  )
}

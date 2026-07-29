"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

interface PatientDetail {
  id: string
  name: string
  dob: string
  sex: string
  address?: string
  contact_number?: string
}

interface VitalsRecord {
  id: number
  weight_kg: number
  temperature_c: number
  oxygen_saturation: number
  heart_rate: number
  recorded_at: string
}

interface LabResult {
  id: string
  file_name: string
  file_url: string
  notes?: string
  uploaded_at: string
}

export default function PatientDetailPage() {
  const params = useParams()
  const patientId = params.id as string
  const [patient, setPatient] = useState<PatientDetail | null>(null)
  const [vitals, setVitals] = useState<VitalsRecord[]>([])
  const [labs, setLabs] = useState<LabResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/patients/${patientId}`).then((r) => r.json()),
    ]).then(([data]) => {
      setPatient(data.patient)
      setVitals(data.vitals || [])
      setLabs(data.labs || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [patientId])

  if (loading) return <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
  if (!patient) return <p className="text-sm text-red-500 text-center py-8">Patient not found</p>

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <Link href="/dashboard/patients" className="text-xs text-gray-500 hover:text-foreground transition-colors">
        &larr; Back to patients
      </Link>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold">
            {patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">ID {patient.id.slice(0, 8)}</p>
            <h2 className="text-xl font-semibold text-foreground">{patient.name}</h2>
            <p className="text-xs text-gray-500">{patient.sex} &middot; DOB: {patient.dob?.slice(0, 10)}</p>
          </div>
        </div>
        {patient.address || patient.contact_number ? (
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {patient.address && <><span className="text-gray-500">Address</span><span>{patient.address}</span></>}
            {patient.contact_number && <><span className="text-gray-500">Contact</span><span>{patient.contact_number}</span></>}
          </div>
        ) : null}
      </div>

      {vitals.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vitals History</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {vitals.map((v) => (
              <div key={v.id} className="px-5 py-2.5 flex items-center justify-between text-sm">
                <span className="text-xs text-gray-400 font-mono">
                  {new Date(v.recorded_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-foreground">
                  {v.weight_kg && `${v.weight_kg} kg`}{v.temperature_c && ` · ${v.temperature_c}°C`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {labs.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lab Results</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {labs.map((l) => (
              <div key={l.id} className="px-5 py-2.5 flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{l.file_name}</p>
                  {l.notes && <p className="text-xs text-gray-500">{l.notes}</p>}
                </div>
                <a href={l.file_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline">View</a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

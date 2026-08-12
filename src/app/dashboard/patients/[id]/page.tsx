"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"

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

interface VisitRecord {
  id: string
  visit_date: string
  diagnosis?: string
  notes?: string
}

interface Medication {
  name: string
  dosage?: string
  frequency?: string
  duration?: string
  instructions?: string
}

interface Prescription {
  id: string
  formatted_number: string
  patient_name: string
  medications: Medication[]
  note?: string
  created_at: string
}

export default function PatientDetailPage() {
  const params = useParams()
  const patientId = params.id as string
  const [patient, setPatient] = useState<PatientDetail | null>(null)
  const [vitals, setVitals] = useState<VitalsRecord[]>([])
  const [labs, setLabs] = useState<LabResult[]>([])
  const [visits, setVisits] = useState<VisitRecord[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [lastVisit, setLastVisit] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadNotes, setUploadNotes] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  useEffect(() => {
    fetch(`/api/patients/${patientId}`)
      .then((r) => r.json())
      .then((data) => {
        setPatient(data.patient)
        setVitals(data.vitals || [])
        setLabs(data.labs || [])
        setVisits(data.visits || [])
        setPrescriptions(data.prescriptions || [])
        setLastVisit(data.lastVisit)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [patientId])

  const uploadLab = async () => {
    if (!uploadFile) return
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = uploadFile.name.split(".").pop()
      const filePath = `${patientId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("lab-results")
        .upload(filePath, uploadFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from("lab-results").getPublicUrl(filePath)

      const res = await fetch("/api/labs/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          file_name: uploadFile.name,
          file_url: publicUrl,
          notes: uploadNotes,
        }),
      })

      if (res.ok) {
        setUploaded(true)
        setUploadFile(null)
        setUploadNotes("")
        const data = await fetch(`/api/patients/${patientId}`).then((r) => r.json())
        setLabs(data.labs || [])
        setTimeout(() => setUploaded(false), 2000)
      }
    } catch {
      /* ignore */
    }
    setUploading(false)
  }

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
          <div className="min-w-0">
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">ID {patient.id.slice(0, 8)}</p>
            <h2 className="text-xl font-semibold text-foreground truncate">{patient.name}</h2>
            <p className="text-xs text-gray-500">
              {patient.sex} &middot; DOB: {patient.dob?.slice(0, 10)}
              {lastVisit && <span> &middot; Last visit: <span className="font-medium">{lastVisit}</span></span>}
            </p>
          </div>
        </div>
        {patient.address || patient.contact_number ? (
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {patient.address && <><span className="text-gray-500">Address</span><span>{patient.address}</span></>}
            {patient.contact_number && <><span className="text-gray-500">Contact</span><span>{patient.contact_number}</span></>}
          </div>
        ) : null}
      </div>

      {visits.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Medical History ({visits.length})</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {visits.map((v) => (
              <div key={v.id} className="px-5 py-3">
                <p className="text-xs text-gray-400 font-mono">{v.visit_date}</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{v.diagnosis || "No diagnosis recorded"}</p>
                {v.notes && <p className="text-xs text-gray-500 mt-0.5">{v.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {prescriptions.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Prescriptions ({prescriptions.length})</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Ticket {rx.formatted_number}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(rx.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {(rx.medications || []).map((m, i) => (
                    <li key={i} className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium text-foreground">{m.name}</span>
                      {m.dosage && <span> — {m.dosage}</span>}
                      {m.frequency && <span>, {m.frequency}</span>}
                      {m.duration && <span> ({m.duration})</span>}
                      {m.instructions && <span className="text-xs text-gray-500"> · {m.instructions}</span>}
                    </li>
                  ))}
                </ul>
                {rx.note && <p className="text-xs text-gray-500 mt-1.5">{rx.note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

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

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lab Results</p>
        </div>
        {labs.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {labs.map((l) => (
              <div key={l.id} className="px-5 py-2.5 flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{l.file_name}</p>
                  {l.notes && <p className="text-xs text-gray-500">{l.notes}</p>}
                </div>
                <a href={l.file_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline shrink-0">View</a>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-4 text-sm text-gray-400 text-center">No lab results uploaded</div>
        )}
        <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 flex flex-col gap-3">
          <p className="text-xs font-medium text-gray-500">Upload New Lab Result</p>
          <input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:text-xs file:font-medium" />
          <input type="text" value={uploadNotes} onChange={(e) => setUploadNotes(e.target.value)}
            placeholder="Notes (optional)" maxLength={200}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
          <button onClick={uploadLab} disabled={uploading || !uploadFile}
            className="self-start px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:bg-gray-300">
            {uploading ? "Uploading..." : uploaded ? "✓ Uploaded" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  )
}

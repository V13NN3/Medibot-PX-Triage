"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"

export default function LabsUploadPage() {
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([])
  const [patientId, setPatientId] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  useEffect(() => {
    fetch("/api/patients/search?q=")
      .then((r) => r.json())
      .then((data) => setPatients(data.patients || []))
  }, [])

  const uploadLabFile = async () => {
    if (!file || !patientId) return
    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const ext = file.name.split(".").pop()
      const filePath = `${patientId}/${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("lab-results")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from("lab-results").getPublicUrl(filePath)

      await fetch("/api/labs/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          file_name: file.name,
          file_url: publicUrl,
          notes,
        }),
      })

      setUploaded(true)
      setFile(null)
      setNotes("")
      setTimeout(() => setUploaded(false), 3000)
    } catch (err) {
      console.error("[labs] upload error:", err)
    }
    setUploading(false)
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Lab Upload</h1>
        <p className="text-sm text-gray-500">Upload lab result files for a patient</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</label>
          <select value={patientId} onChange={(e) => setPatientId(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
            <option value="">Select patient...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">File</label>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full mt-1 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white file:text-sm file:font-medium" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Notes (optional)</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., CBC results, X-ray notes"
            className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
        </div>

        <button onClick={uploadLabFile} disabled={uploading || !file || !patientId}
          className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:bg-gray-300">
          {uploading ? "Uploading..." : uploaded ? "✓ Uploaded!" : "Upload Lab Result"}
        </button>
      </div>
    </div>
  )
}

import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { patient_id, file_name, file_url, notes } = await req.json()

    if (!patient_id || !file_name || !file_url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    const doctorId = user?.id

    const { data, error } = await supabase
      .from("lab_results")
      .insert({
        patient_id,
        doctor_id: doctorId,
        file_name,
        file_url,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ lab: data })
  } catch (err) {
    console.error("[triage/labs/upload] error:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

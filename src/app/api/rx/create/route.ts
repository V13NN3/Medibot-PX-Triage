import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { ticket_id, formatted_number, patient_name, doctor_id, medications, note } = await req.json()

    if (!ticket_id || !formatted_number || !patient_name || !doctor_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    if (!Array.isArray(medications) || medications.length === 0) {
      return NextResponse.json({ error: "At least one medication is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("prescriptions")
      .insert({
        ticket_id,
        formatted_number,
        patient_name,
        doctor_id,
        medications: medications.map((m) => ({
          name: String(m.name || "").trim(),
          dosage: String(m.dosage || "").trim(),
          frequency: String(m.frequency || "").trim(),
          instructions: String(m.instructions || "").trim(),
          duration: String(m.duration || "").trim(),
        })),
        note: note || null,
      })
      .select("id, formatted_number, patient_name, medications, note, created_at")
      .single()

    if (error) {
      console.error("[triage/rx] insert error:", error)
      return NextResponse.json({ error: "Failed to create prescription" }, { status: 500 })
    }

    return NextResponse.json({ prescription: data })
  } catch (err) {
    console.error("[triage/rx] create error:", err)
    return NextResponse.json({ error: "Failed to create prescription" }, { status: 500 })
  }
}

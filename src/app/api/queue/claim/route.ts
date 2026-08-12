import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { ticket_id, doctor_id, patient_name } = await req.json()
    if (!ticket_id || !doctor_id) {
      return NextResponse.json({ error: "Missing ticket_id or doctor_id" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const update: Record<string, unknown> = { doctor_id }
    if (patient_name) {
      update.patient_name = String(patient_name)
    }

    const { data: claimed } = await supabase
      .from("queue_tickets")
      .update(update)
      .eq("id", ticket_id)
      .select("id, formatted_number, patient_name, doctor_id, status")
      .single()

    return NextResponse.json({ ticket: claimed })
  } catch (err) {
    console.error("[triage/queue] claim error:", err)
    return NextResponse.json({ error: "Failed to claim patient" }, { status: 500 })
  }
}

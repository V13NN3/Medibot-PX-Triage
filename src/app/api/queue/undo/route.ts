import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/db"

function getToday(): string {
  const now = new Date()
  const phNow = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  return phNow.toISOString().slice(0, 10)
}

export async function POST(req: NextRequest) {
  try {
    const { doctor_id } = await req.json()
    if (!doctor_id) {
      return NextResponse.json({ error: "Missing doctor_id" }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const today = getToday()

    const { data: latest } = await supabase
      .from("queue_tickets")
      .select("id, formatted_number, patient_name")
      .or(`doctor_id.eq.${doctor_id},doctor_id.is.null`)
      .eq("status", "called")
      .eq("queue_date", today)
      .order("called_at", { ascending: false })
      .limit(1)
      .single()

    if (!latest) {
      return NextResponse.json({ error: "No called number to undo" }, { status: 400 })
    }

    const { data: undone } = await supabase
      .from("queue_tickets")
      .update({ status: "waiting", doctor_id: null, called_at: null })
      .eq("id", latest.id)
      .select("formatted_number, patient_name")
      .single()

    return NextResponse.json({
      formatted: undone?.formatted_number,
      patientName: undone?.patient_name,
    })
  } catch (err) {
    console.error("[triage/queue] undo error:", err)
    return NextResponse.json({ error: "Failed to undo call" }, { status: 500 })
  }
}

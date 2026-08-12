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
      return NextResponse.json({ error: "No called number to re-call" }, { status: 400 })
    }

    await supabase
      .from("queue_tickets")
      .update({ called_at: new Date().toISOString() })
      .eq("id", latest.id)

    return NextResponse.json({
      formatted: latest.formatted_number,
      patientName: latest.patient_name,
    })
  } catch (err) {
    console.error("[triage/queue] recall error:", err)
    return NextResponse.json({ error: "Failed to re-call number" }, { status: 500 })
  }
}

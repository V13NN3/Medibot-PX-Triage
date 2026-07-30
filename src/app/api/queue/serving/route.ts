import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/db"

function getToday(): string {
  const now = new Date()
  const phNow = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  return phNow.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  try {
    const doctorId = req.nextUrl.searchParams.get("doctor_id")
    const supabase = await createAdminClient()
    const today = getToday()

    if (doctorId) {
      const filter = `doctor_id.eq.${doctorId},doctor_id.is.null`

      const { data: waiting } = await supabase
        .from("queue_tickets")
        .select("id, ticket_number, formatted_number, patient_name, doctor_id, created_at")
        .or(filter)
        .eq("status", "waiting")
        .eq("queue_date", today)
        .order("ticket_number")

      const { data: lastCalled } = await supabase
        .from("queue_tickets")
        .select("formatted_number, patient_name")
        .or(`doctor_id.eq.${doctorId},doctor_id.is.null`)
        .eq("status", "called")
        .eq("queue_date", today)
        .order("called_at", { ascending: false })
        .limit(1)

      const myPatients = (waiting || []).filter((t) => t.doctor_id === doctorId)
      const walkIns = (waiting || []).filter((t) => !t.doctor_id)
      const nextTicket = waiting && waiting.length > 0 ? waiting[0] : null

      return NextResponse.json({
        waiting: waiting || [],
        myPatients,
        walkIns,
        waitingCount: waiting?.length || 0,
        nextTicket,
        lastCalled: lastCalled && lastCalled.length > 0 ? lastCalled[0] : null,
      })
    }

    const { data: latest } = await supabase
      .from("queue_tickets")
      .select("formatted_number, patient_name, doctor_id")
      .eq("status", "called")
      .eq("queue_date", today)
      .order("called_at", { ascending: false })
      .limit(1)

    return NextResponse.json({
      formatted: latest && latest.length > 0 ? latest[0].formatted_number : "A-000",
      patientName: latest && latest.length > 0 ? latest[0].patient_name : "",
    })
  } catch (err) {
    console.error("[triage/queue] GET error:", err)
    return NextResponse.json({ error: "Failed to get queue" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { doctor_id } = await req.json()
    if (!doctor_id) {
      return NextResponse.json({ error: "Missing doctor_id" }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const today = getToday()

    const filter = `doctor_id.eq.${doctor_id},doctor_id.is.null`

    const { data: nextTicket } = await supabase
      .from("queue_tickets")
      .select("id, ticket_number, formatted_number, patient_name, doctor_id")
      .or(filter)
      .eq("status", "waiting")
      .eq("queue_date", today)
      .order("ticket_number")
      .limit(1)
      .single()

    if (!nextTicket) {
      return NextResponse.json({ error: "No patients waiting" }, { status: 400 })
    }

    const update: Record<string, unknown> = {
      status: "called",
      called_at: new Date().toISOString(),
    }
    if (!nextTicket.doctor_id) {
      update.doctor_id = doctor_id
    }

    const { data: updated } = await supabase
      .from("queue_tickets")
      .update(update)
      .eq("id", nextTicket.id)
      .select("ticket_number, formatted_number, patient_name")
      .single()

    return NextResponse.json({
      formatted: updated?.formatted_number,
      patientName: updated?.patient_name,
      ticketNumber: updated?.ticket_number,
      claimed: !nextTicket.doctor_id,
    })
  } catch (err) {
    console.error("[triage/queue] POST error:", err)
    return NextResponse.json({ error: "Failed to call next" }, { status: 500 })
  }
}

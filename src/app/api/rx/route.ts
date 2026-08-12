import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const ticketId = req.nextUrl.searchParams.get("ticket_id")

    const supabase = await createAdminClient()

    if (ticketId) {
      const { data } = await supabase
        .from("prescriptions")
        .select("id, formatted_number, patient_name, doctor_id, medications, note, created_at")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: false })

      return NextResponse.json({ prescriptions: data || [] })
    }

    return NextResponse.json({ prescriptions: [] })
  } catch (err) {
    console.error("[triage/rx] get error:", err)
    return NextResponse.json({ error: "Failed to get prescriptions" }, { status: 500 })
  }
}

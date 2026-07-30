import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q") || ""
    const doctorId = req.nextUrl.searchParams.get("doctor_id")
    const supabase = await createAdminClient()

    if (doctorId) {
      const { data: slots } = await supabase
        .from("doctor_schedule")
        .select("id, day_of_week, start_time, end_time, is_available")
        .eq("doctor_id", doctorId)
        .order("day_of_week")
        .order("start_time")
      return NextResponse.json({ slots: slots || [] })
    }

    let query = supabase
      .from("doctors")
      .select("id, name, specialty, avatar_initials, available")

    if (q) {
      query = query.or(`name.ilike.%${q}%,specialty.ilike.%${q}%`)
    }

    const { data } = await query
      .order("available", { ascending: false })
      .order("name")

    return NextResponse.json({ doctors: data || [] })
  } catch (err) {
    console.error("[triage/schedule] GET error:", err)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { doctor_id, slots } = await req.json()
    const supabase = await createAdminClient()

    await supabase.from("doctor_schedule").delete().eq("doctor_id", doctor_id)

    if (slots && slots.length > 0) {
      const { error } = await supabase.from("doctor_schedule").insert(
        slots.map((s: { day_of_week: number; start_time: string; end_time: string; is_available: boolean }) => ({
          doctor_id,
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          is_available: s.is_available,
        })),
      )
      if (error) throw error
    }

    return NextResponse.json({ saved: true })
  } catch (err) {
    console.error("[triage/schedule] POST error:", err)
    return NextResponse.json({ error: "Failed to save schedule" }, { status: 500 })
  }
}

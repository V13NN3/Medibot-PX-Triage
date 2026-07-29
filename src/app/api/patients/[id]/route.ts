import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()

    const { data: patient } = await supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .single()

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    const { data: vitals } = await supabase
      .from("vitals_log")
      .select("*")
      .eq("patient_id", id)
      .order("recorded_at", { ascending: false })
      .limit(20)

    const { data: labs } = await supabase
      .from("lab_results")
      .select("*")
      .eq("patient_id", id)
      .order("uploaded_at", { ascending: false })
      .limit(20)

    return NextResponse.json({ patient, vitals: vitals || [], labs: labs || [] })
  } catch (err) {
    console.error("[triage/patients/[id]] error:", err)
    return NextResponse.json({ error: "Failed to get patient" }, { status: 500 })
  }
}

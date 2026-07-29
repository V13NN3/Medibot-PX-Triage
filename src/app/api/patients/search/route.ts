import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q") || ""
    const supabase = await createAdminClient()

    if (q.length < 2) {
      const { data } = await supabase
        .from("patients")
        .select("id, name, dob, sex")
        .order("name")
        .limit(20)
      return NextResponse.json({ patients: data || [] })
    }

    const { data } = await supabase
      .from("patients")
      .select("id, name, dob, sex")
      .ilike("name", `%${q}%`)
      .order("name")
      .limit(20)

    return NextResponse.json({ patients: data || [] })
  } catch (err) {
    console.error("[triage/patients/search] error:", err)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}

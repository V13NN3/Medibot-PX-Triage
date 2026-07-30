import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { doctor_id, name } = await req.json()
    if (!doctor_id || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { error: docError } = await supabase
      .from("doctors")
      .update({ name })
      .eq("id", doctor_id)

    if (docError) {
      return NextResponse.json({ error: "Failed to update doctor" }, { status: 500 })
    }

    const initials = name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()

    const { error: avatarError } = await supabase
      .from("doctors")
      .update({ avatar_initials: initials })
      .eq("id", doctor_id)

    if (avatarError) {
      console.error("[account/update] avatar error:", avatarError.message)
    }

    const { error: accountError } = await supabase
      .from("doctor_accounts")
      .update({ name })
      .eq("doctor_id", doctor_id)

    if (accountError) {
      return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
    }

    return NextResponse.json({ success: true, name })
  } catch (err) {
    console.error("[account/update] error:", err)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}

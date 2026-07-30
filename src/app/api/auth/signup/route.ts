import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, specialty } = await req.json()

    if (!name || !email || !password || !specialty) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, specialty },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const initials = name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()

    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .insert({ name, specialty, avatar_initials: initials, available: true })
      .select()
      .single()

    if (doctorError) {
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ error: "Failed to create doctor record" }, { status: 500 })
    }

    const { error: linkError } = await supabase
      .from("doctor_accounts")
      .insert({
        user_id: authUser.user.id,
        doctor_id: doctor.id,
        email,
        name,
      })

    if (linkError) {
      await supabase.auth.admin.deleteUser(authUser.user.id)
      await supabase.from("doctors").delete().eq("id", doctor.id)
      return NextResponse.json({ error: "Failed to link account" }, { status: 500 })
    }

    return NextResponse.json({ success: true, doctor: { id: doctor.id, name: doctor.name } })
  } catch (err) {
    console.error("[auth/signup] error:", err)
    return NextResponse.json({ error: "Signup failed" }, { status: 500 })
  }
}

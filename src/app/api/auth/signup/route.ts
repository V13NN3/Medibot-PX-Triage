import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/db"

function getBase(req: NextRequest) {
  const host = req.headers.get("host") || "localhost"
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "http"
  return `${proto}://${host}`
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || ""
  let name = ""
  let email = ""
  let password = ""
  let specialty = ""

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await req.formData()
    name = String(form.get("name") || "").trim()
    email = String(form.get("email") || "").trim()
    specialty = String(form.get("specialty") || "").trim()
    password = String(form.get("password") || "")
  } else {
    const body = await req.json()
    name = String(body.name || "").trim()
    email = String(body.email || "").trim()
    specialty = String(body.specialty || "").trim()
    password = String(body.password || "")
  }

  if (!name || !email || !password || !specialty) {
    const base = getBase(req)
    return NextResponse.redirect(
      new URL(`/signup?error=${encodeURIComponent("All fields are required")}`, base),
      303,
    )
  }

  if (password.length < 6) {
    const base = getBase(req)
    return NextResponse.redirect(
      new URL(`/signup?error=${encodeURIComponent("Password must be at least 6 characters")}`, base),
      303,
    )
  }

  const failRedirect = (message: string) => {
    const base = getBase(req)
    return NextResponse.redirect(new URL(`/signup?error=${encodeURIComponent(message)}`, base), 303)
  }

  const supabase = await createAdminClient()

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, specialty },
  })

  if (authError) {
    console.error("[auth/signup] auth error:", authError.message)
    return failRedirect(authError.message)
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
    console.error("[auth/signup] doctor insert error:", doctorError.message)
    await supabase.auth.admin.deleteUser(authUser.user.id)
    return failRedirect(`Database error: ${doctorError.message}`)
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
    console.error("[auth/signup] link error:", linkError.message)
    await supabase.auth.admin.deleteUser(authUser.user.id)
    await supabase.from("doctors").delete().eq("id", doctor.id)
    return failRedirect(`Database error: ${linkError.message}`)
  }

  const cookieStore = await cookies()
  const browser = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name: cName, value, options }) => cookieStore.set(cName, value, options))
        },
      },
    },
  )

  const { error: signInError } = await browser.auth.signInWithPassword({ email, password })
  if (signInError) {
    console.error("[auth/signup] post sign-in error:", signInError.message)
    return failRedirect("Account created but sign-in failed. Please try signing in.")
  }

  return NextResponse.redirect(new URL("/dashboard", getBase(req)), 303)
}

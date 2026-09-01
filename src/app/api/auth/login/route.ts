import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  const host = req.headers.get("host") || "localhost"
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "http"
  const base = `${proto}://${host}`

  const formData = await req.formData()
  const email = String(formData.get("email") || "").trim()
  const password = String(formData.get("password") || "")

  if (!email || !password) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent("Enter your email and password")}`, base),
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.session) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error?.message || "Login failed")}`, base),
    )
  }

  return NextResponse.redirect(new URL("/dashboard", base), 303)
}

"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get("error")
    if (err) setError(err)
  }, [])

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = emailRef.current?.value.trim() ?? ""
    const password = passwordRef.current?.value ?? ""
    if (!email || !password) {
      setError("Enter your email and password")
      return
    }
    setLoading(true)
    setError("")
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Medibot PX</h1>
          <p className="text-sm text-gray-500">Doctor Triage Dashboard</p>
        </div>
        <form onSubmit={login} method="post" action="/api/auth/login" className="flex flex-col gap-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <div>
            <label htmlFor="email" className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</label>
            <input id="email" name="email" ref={emailRef} type="email" autoComplete="email"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
          </div>
          <div>
            <label htmlFor="password" className="text-xs font-medium text-gray-500 uppercase tracking-wider">Password</label>
            <input id="password" name="password" ref={passwordRef} type="password" autoComplete="current-password"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:bg-gray-300 text-sm">
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-xs text-gray-500 text-center">
            No account yet?{" "}
            <Link href="/signup" className="text-primary font-medium hover:underline">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"

const SPECIALTIES = [
  "Cardiology", "Internal Medicine", "Pediatrics", "Nephrology",
  "Pulmonology", "Orthopedics", "Neurology", "Dermatology",
  "Ophthalmology", "ENT", "General Practice", "Surgery",
  "Emergency Medicine", "Radiology", "Anesthesiology",
  "Pathology", "Psychiatry", "Other",
]

export default function SignupPage() {
  const router = useRouter()
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const specialtyRef = useRef<HTMLSelectElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get("error")
    if (err) setError(err)
  }, [])

  const signup = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = nameRef.current?.value.trim() ?? ""
    const email = emailRef.current?.value.trim() ?? ""
    const specialty = specialtyRef.current?.value ?? ""
    const password = passwordRef.current?.value ?? ""
    const confirm = confirmRef.current?.value ?? ""

    setError("")
    if (!name || !email || !password || !specialty) {
      setError("All fields are required")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, specialty }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Signup failed")
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError("Account created but sign-in failed. Please try signing in.")
        setLoading(false)
        return
      }
      router.push("/dashboard")
    } catch {
      setError("Network error")
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Medibot PX</h1>
          <p className="text-sm text-gray-500">Doctor Triage Dashboard</p>
        </div>

        <form onSubmit={signup} method="post" action="/api/auth/signup" className="flex flex-col gap-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Create Account</p>

          <div>
            <label htmlFor="name" className="text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</label>
            <input id="name" name="name" ref={nameRef} type="text" autoComplete="name"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
          </div>
          <div>
            <label htmlFor="email" className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</label>
            <input id="email" name="email" ref={emailRef} type="email" autoComplete="email"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
          </div>

          <div>
            <label htmlFor="specialty" className="text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</label>
            <select id="specialty" name="specialty" ref={specialtyRef}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
              <option value="">Select specialty...</option>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="password" className="text-xs font-medium text-gray-500 uppercase tracking-wider">Password</label>
            <input id="password" name="password" ref={passwordRef} type="password" autoComplete="new-password"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
          </div>
          <div>
            <label htmlFor="confirm" className="text-xs font-medium text-gray-500 uppercase tracking-wider">Confirm Password</label>
            <input id="confirm" name="confirm" ref={confirmRef} type="password" autoComplete="new-password"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:bg-gray-300 text-sm">
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Already have an account?{" "}
            <Link href="/" className="text-primary font-medium hover:underline">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

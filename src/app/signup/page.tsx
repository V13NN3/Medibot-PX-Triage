"use client"

import { useState } from "react"
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
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const signup = async () => {
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

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Medibot PX</h1>
          <p className="text-sm text-gray-500">Doctor Triage Dashboard</p>
        </div>

        <div className="flex flex-col gap-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Create Account</p>

          {name && (
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                {initials}
              </div>
            </div>
          )}

          {([
            { label: "Full Name", key: "name", type: "text" },
            { label: "Email", key: "email", type: "email" },
          ] as const).map((field) => (
            <div key={field.key}>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{field.label}</label>
              <input type={field.type} value={eval(field.key)} onChange={(e) => {
                if (field.key === "name") setName(e.target.value)
                if (field.key === "email") setEmail(e.target.value)
              }}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
            </div>
          ))}

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</label>
            <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
              <option value="">Select specialty...</option>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Confirm Password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && signup()}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button onClick={signup} disabled={loading || !name || !email || !password || !confirm || !specialty}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:bg-gray-300 text-sm">
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Already have an account?{" "}
            <Link href="/" className="text-primary font-medium hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"

export default function SettingsPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [doctorId, setDoctorId] = useState("")
  const [savingName, setSavingName] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setEmail(user.email || "")
      const { data: account } = await supabase
        .from("doctor_accounts")
        .select("doctor_id, name")
        .eq("user_id", user.id)
        .single()
      if (account) {
        setName(account.name)
        setDoctorId(account.doctor_id)
      }
    })
  }, [])

  const updateName = async () => {
    if (!name || !doctorId) return
    setSavingName(true)
    setError("")
    try {
      const res = await fetch("/api/account/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_id: doctorId, name }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Update failed")
      } else {
        setNameSaved(true)
        setTimeout(() => setNameSaved(false), 2000)
      }
    } catch {
      setError("Network error")
    }
    setSavingName(false)
  }

  const updatePassword = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters")
      return
    }
    setSavingPassword(true)
    setError("")
    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
      if (signInError) {
        setError("Current password is incorrect")
        setSavingPassword(false)
        return
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) {
        setError(updateError.message)
      } else {
        setPasswordSaved(true)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setTimeout(() => setPasswordSaved(false), 2000)
      }
    } catch {
      setError("Network error")
    }
    setSavingPassword(false)
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-gray-500">Manage your account</p>
      </div>

      {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2">{error}</p>}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Profile</p>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
        </div>
        <button onClick={updateName} disabled={savingName || !name}
          className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:bg-gray-300 text-sm">
          {savingName ? "Saving..." : nameSaved ? "✓ Saved!" : "Update Name"}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Change Password</p>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</label>
          <p className="mt-1 px-3 py-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg">{email}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current Password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Confirm New Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
        </div>
        <button onClick={updatePassword} disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
          className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:bg-gray-300 text-sm">
          {savingPassword ? "Updating..." : passwordSaved ? "✓ Password Updated!" : "Update Password"}
        </button>
      </div>
    </div>
  )
}

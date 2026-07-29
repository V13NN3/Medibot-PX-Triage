"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Queue", href: "/dashboard/queue", icon: "🎫" },
  { label: "Patients", href: "/dashboard/patients", icon: "🧑‍⚕️" },
  { label: "Schedule", href: "/dashboard/schedule", icon: "📅" },
  { label: "Lab Upload", href: "/dashboard/labs", icon: "🔬" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/")
      } else {
        setUser(data.user)
      }
      setLoading(false)
    })
  }, [router])

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading...</div>
  if (!user) return null

  return (
    <div className="flex-1 flex">
      <aside className="w-56 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="h-14 flex items-center px-4 border-b border-gray-200 dark:border-gray-800">
          <span className="text-sm font-bold text-foreground">Medibot PX</span>
          <span className="text-[10px] text-gray-400 ml-2">Triage</span>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                pathname === item.href
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}>
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500 truncate mb-2">{user.email}</p>
          <button onClick={logout}
            className="w-full py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}

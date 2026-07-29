import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Medibot PX — Triage",
  description: "Doctor dashboard for Medibot PX",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-950 text-foreground">
        {children}
      </body>
    </html>
  )
}

import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/db"

const phOffset = 8 * 60

function getToday(): string {
  const now = new Date()
  const phNow = new Date(now.getTime() + phOffset * 60 * 1000)
  return phNow.toISOString().slice(0, 10)
}

export async function GET() {
  try {
    const supabase = await createAdminClient()
    const today = getToday()

    const { data } = await supabase
      .from("queue_counter")
      .select("current_number, now_serving")
      .eq("queue_date", today)
      .single()

    if (!data) {
      return NextResponse.json({ formatted: "A-000", nowServing: 0, currentNumber: 0, nextNumber: 1 })
    }

    return NextResponse.json({
      formatted: `A-${String(data.now_serving).padStart(3, "0")}`,
      nowServing: data.now_serving,
      currentNumber: data.current_number,
      nextNumber: data.current_number + 1,
    })
  } catch (err) {
    console.error("[triage/queue] GET error:", err)
    return NextResponse.json({ error: "Failed to get queue" }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = await createAdminClient()
    const today = getToday()

    const { data, error } = await supabase
      .from("queue_counter")
      .select("id, now_serving, current_number")
      .eq("queue_date", today)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "No queue started today" }, { status: 400 })
    }

    if (data.now_serving >= data.current_number) {
      return NextResponse.json({ error: "No patients waiting" }, { status: 400 })
    }

    const { data: updated } = await supabase
      .from("queue_counter")
      .update({ now_serving: data.now_serving + 1, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .select("current_number, now_serving")
      .single()

    if (!updated) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 })
    }

    return NextResponse.json({
      formatted: `A-${String(updated.now_serving).padStart(3, "0")}`,
      nowServing: updated.now_serving,
      currentNumber: updated.current_number,
    })
  } catch (err) {
    console.error("[triage/queue] POST error:", err)
    return NextResponse.json({ error: "Failed to update queue" }, { status: 500 })
  }
}

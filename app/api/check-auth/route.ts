import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get("auth")

  if (authCookie?.value === "true") {
    return NextResponse.json({ isAuthenticated: true })
  }

  return NextResponse.json({ isAuthenticated: false }, { status: 401 })
}


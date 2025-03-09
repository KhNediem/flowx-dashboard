import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { email, password } = await request.json()

  // In a real application, you would validate the email and password against a database
  if (email === "admin@example.com" && password === "password") {
    // Set a cookie to indicate the user is logged in
    const response = NextResponse.json({ success: true })
    response.cookies.set("auth", "true", { httpOnly: true, secure: true })
    return response
  }

  return NextResponse.json({ success: false }, { status: 401 })
}
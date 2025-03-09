import type React from "react"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { AuthProvider } from "@/contexts/AuthContext"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import "@/styles/globals.css"

const inter = Inter({ subsets: ["latin"] })

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider initialSession={session}>
          {children}
          <Toaster richColors />
        </AuthProvider>
      </body>
    </html>
  )
}


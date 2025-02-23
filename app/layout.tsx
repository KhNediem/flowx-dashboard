import type React from "react"
import "@/styles/globals.css"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/contexts/AuthContext"
import { AnimatedLayout } from "@/components/animated-layout"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <AnimatedLayout>{children}</AnimatedLayout>
        </AuthProvider>
      </body>
    </html>
  )
}


"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function GoogleLoginButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleGoogleLogin = async () => {
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) {
        toast.error(error.message)
      }
    } catch (error) {
      console.error("Google login error:", error)
      toast.error("Failed to sign in with Google")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleGoogleLogin} variant="outline" className="w-full" disabled={isLoading}>
      {isLoading ? "Connecting..." : "Sign in with Google"}
    </Button>
  )
}

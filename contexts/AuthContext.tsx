"use client"

import type React from "react"

import { createContext, useState, useContext, useEffect } from "react"
import type { Session, User, AuthError } from "@supabase/supabase-js"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface AuthContextType {
  user: User | null
  session: Session | null
  signOut: () => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({
  children,
  initialSession,
}: { children: React.ReactNode; initialSession: Session | null }) {
  const [user, setUser] = useState<User | null>(initialSession?.user || null)
  const [session, setSession] = useState<Session | null>(initialSession)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const value = {
    user,
    session,
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}


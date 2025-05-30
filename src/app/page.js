"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (status === "authenticated") {
      // User is authenticated, redirect to dashboard
      router.push('/dashboard')
    } else {
      // User is not authenticated, redirect to login
      router.push('/login')
    }
  }, [status, router])

  // Show loading while determining redirect
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold mb-2">Papelería Papelón</h1>
        <p className="text-muted-foreground">
          {status === "loading" 
            ? "Verificando sesión..." 
            : status === "authenticated" 
              ? "Redirigiendo al dashboard..."
              : "Redirigiendo al login..."
          }
        </p>
      </div>
    </div>
  );
}

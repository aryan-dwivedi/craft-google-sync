"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, ArrowRight } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export function LaunchScreenClient() {
  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#292c44]">
       {/* Animated Gradient Background */}
       <div className="absolute inset-0 bg-gradient-to-br from-[#3c2cd4] via-[#2d2a5c] to-[#fbdbb4] opacity-40 animate-gradient-xy" />

       {/* Glass Card */}
       <Card className="relative z-10 w-full max-w-md border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
         <CardHeader className="text-center space-y-6 pt-8">
           <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-[#3c2cd4] to-[#fbdbb4] flex items-center justify-center shadow-lg ring-1 ring-white/20">
             <Calendar className="w-10 h-10 text-white" />
           </div>
           <div className="space-y-2">
             <CardTitle className="text-4xl font-bold text-white tracking-tight">
               Craft Sync
             </CardTitle>
             <CardDescription className="text-gray-300 text-lg font-medium">
               Your calendar and notes,<br/>perfectly in sync.
             </CardDescription>
           </div>
         </CardHeader>
         <CardContent className="space-y-6 pb-8 px-8">
           <Button
             onClick={handleLogin}
             className="w-full h-14 text-lg font-semibold bg-[#3c2cd4] hover:bg-[#3c2cd4]/90 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] rounded-xl border border-white/10 cursor-pointer"
           >
             Connect with Google
             <ArrowRight className="ml-2 w-5 h-5" />
           </Button>
           <p className="text-xs text-center text-gray-400">
             By connecting, you agree to our Terms and Privacy Policy.
           </p>
         </CardContent>
       </Card>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from "@/utils/supabase/server"
import { LaunchScreenClient } from "./LaunchScreenClient"

export default async function LaunchScreen() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return <LaunchScreenClient />
}

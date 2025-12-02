'use server'

import { createClient } from '@/utils/supabase/server'

export async function getConnectionStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { google: false, craft: false }
  }

  // Check Google connection (if user has provider token)
  const { data: { session } } = await supabase.auth.getSession()
  const googleConnected = !!session?.provider_token

  // Check Craft connection from user_settings
  const { data: settings } = await supabase
    .from('user_settings')
    .select('craft_api_token')
    .eq('user_id', user.id)
    .single()
  
  const craftConnected = !!settings?.craft_api_token

  return { google: googleConnected, craft: craftConnected }
}

export async function getSyncLogs(limit = 10) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data } = await supabase
    .from('sync_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return data || []
}

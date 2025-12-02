'use server'

import { createClient } from '@/utils/supabase/server'

export interface UserSettings {
  craft_api_url: string
  craft_api_token: string | null
  onboarding_completed: boolean
}

export async function getUserSettings(): Promise<UserSettings | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return data
}

export async function saveUserSettings(settings: Partial<UserSettings>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: user.id,
      ...settings,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function validateCraftToken(url: string, token: string): Promise<boolean> {
  try {
    // Try to fetch tasks to validate the token
    const response = await fetch(`${url}/tasks?scope=active`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    
    console.log('Craft API validation response:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Craft API validation failed:', errorText)
    }
    
    return response.ok
  } catch (error) {
    console.error('Craft API validation error:', error)
    return false
  }
}

export async function completeOnboarding() {
  return saveUserSettings({ onboarding_completed: true })
}

import { createClient, createServiceClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      console.log('OAuth session established successfully')

      // Persist tokens to database for long-term storage
      // This ensures tokens survive beyond the session cookie lifetime
      if (data.session.provider_token && data.session.provider_refresh_token) {
        try {
          const serviceSupabase = createServiceClient()

          // Calculate token expiry (Google tokens typically last 1 hour)
          const tokenExpiry = new Date(Date.now() + 3600 * 1000).toISOString()

          // Update all user calendars with the new tokens
          const { error: updateError } = await serviceSupabase
            .from('calendars')
            .update({
              access_token: data.session.provider_token,
              refresh_token: data.session.provider_refresh_token,
              token_expiry: tokenExpiry,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', data.session.user.id)

          if (updateError) {
            console.error('Failed to persist OAuth tokens:', updateError)
          } else {
            console.log('Successfully persisted OAuth tokens to database')
          }
        } catch (err) {
          console.error('Error persisting OAuth tokens:', err)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

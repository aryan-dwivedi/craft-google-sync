import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'
import { refreshGoogleTokens } from '@/lib/google-auth'

/**
 * API endpoint to proactively refresh tokens that are expiring soon
 * Can be called by a cron job or webhook
 */
export async function POST() {
  const supabase = createServiceClient()

  // Find all calendars with tokens expiring in the next hour or already expired
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  const { data: calendars, error } = await supabase
    .from('calendars')
    .select('*')
    .eq('is_enabled', true)
    .not('refresh_token', 'is', null)
    .or(`token_expiry.is.null,token_expiry.lt.${oneHourFromNow}`)

  if (error) {
    console.error('Error fetching calendars for token refresh:', error)
    return NextResponse.json({ error: 'Failed to fetch calendars' }, { status: 500 })
  }

  if (!calendars || calendars.length === 0) {
    return NextResponse.json({
      message: 'No calendars need token refresh',
      refreshed: 0
    })
  }

  console.log(`Found ${calendars.length} calendars that need token refresh`)

  const results = {
    total: calendars.length,
    refreshed: 0,
    failed: 0,
    errors: [] as string[]
  }

  // Refresh tokens for each calendar
  for (const calendar of calendars) {
    try {
      if (!calendar.refresh_token) {
        console.log(`Skipping calendar ${calendar.google_calendar_id} - no refresh token`)
        results.failed++
        continue
      }

      console.log(`Refreshing tokens for calendar: ${calendar.google_calendar_id}`)

      const newTokens = await refreshGoogleTokens(calendar.refresh_token)

      if (newTokens) {
        // Update tokens in database
        const { error: updateError } = await supabase
          .from('calendars')
          .update({
            access_token: newTokens.access_token,
            token_expiry: new Date(newTokens.expiry_date).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', calendar.id)

        if (updateError) {
          console.error(`Failed to update tokens for ${calendar.google_calendar_id}:`, updateError)
          results.failed++
          results.errors.push(`${calendar.google_calendar_id}: ${updateError.message}`)
        } else {
          console.log(`Successfully refreshed tokens for ${calendar.google_calendar_id}`)
          results.refreshed++
        }
      } else {
        console.error(`Failed to refresh tokens for ${calendar.google_calendar_id}`)
        results.failed++
        results.errors.push(`${calendar.google_calendar_id}: Refresh returned null`)
      }
    } catch (error) {
      console.error(`Error refreshing tokens for ${calendar.google_calendar_id}:`, error)
      results.failed++
      results.errors.push(`${calendar.google_calendar_id}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return NextResponse.json({
    message: `Token refresh complete: ${results.refreshed} succeeded, ${results.failed} failed`,
    ...results
  })
}

// Allow GET for health checks
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/refresh-tokens',
    description: 'Proactively refresh Google OAuth tokens for enabled calendars'
  })
}

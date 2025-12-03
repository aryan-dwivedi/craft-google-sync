import { google } from 'googleapis'
import { createServiceClient } from '@/utils/supabase/server'

/**
 * Create and configure an OAuth2 client with automatic token refresh
 */
export function createGoogleOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
}

/**
 * Set up OAuth2 client with tokens and automatic refresh handler
 * This will automatically refresh expired tokens and persist them to the database
 */
export async function setupOAuthClientWithRefresh(
  accessToken: string,
  refreshToken: string | null,
  userId: string,
  calendarId: string
) {
  const oauth2Client = createGoogleOAuthClient()

  // Set credentials
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken || undefined,
  })

  // Set up automatic token refresh handler
  oauth2Client.on('tokens', async (tokens) => {
    console.log('Google OAuth tokens refreshed:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    })

    // Persist new tokens to database
    try {
      const supabase = createServiceClient()

      const updateData: {
        access_token: string
        refresh_token?: string
        token_expiry?: string
        updated_at: string
      } = {
        access_token: tokens.access_token!,
        updated_at: new Date().toISOString(),
      }

      // Only update refresh token if we received a new one
      if (tokens.refresh_token) {
        updateData.refresh_token = tokens.refresh_token
      }

      // Store token expiry if available
      if (tokens.expiry_date) {
        updateData.token_expiry = new Date(tokens.expiry_date).toISOString()
      }

      const { error } = await supabase
        .from('calendars')
        .update(updateData)
        .eq('user_id', userId)
        .eq('google_calendar_id', calendarId)

      if (error) {
        console.error('Failed to persist refreshed tokens:', error)
      } else {
        console.log('Successfully persisted refreshed tokens to database')
      }
    } catch (error) {
      console.error('Error persisting refreshed tokens:', error)
    }
  })

  return oauth2Client
}

/**
 * Refresh tokens manually if needed
 * Returns new access token or null if refresh failed
 */
export async function refreshGoogleTokens(
  refreshToken: string
): Promise<{ access_token: string; expiry_date: number } | null> {
  try {
    const oauth2Client = createGoogleOAuthClient()
    oauth2Client.setCredentials({ refresh_token: refreshToken })

    const { credentials } = await oauth2Client.refreshAccessToken()

    if (credentials.access_token && credentials.expiry_date) {
      return {
        access_token: credentials.access_token,
        expiry_date: credentials.expiry_date,
      }
    }

    return null
  } catch (error) {
    console.error('Failed to refresh Google tokens:', error)
    return null
  }
}

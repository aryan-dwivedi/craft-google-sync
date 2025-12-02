'use server'

import { createClient } from '@/utils/supabase/server'
import { google } from 'googleapis'
import { CraftClient } from '@/lib/craft'
import { getUserSettings } from './settings'

export async function listGoogleCalendars() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data: { session } } = await supabase.auth.getSession()
  const providerToken = session?.provider_token

  if (!providerToken) {
    throw new Error('No provider token found')
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  
  oauth2Client.setCredentials({ access_token: providerToken })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  
  try {
    const response = await calendar.calendarList.list()
    return response.data.items || []
  } catch (error) {
    console.error('Error fetching calendars:', error)
    throw error
  }
}

async function syncCalendarEvents(calendarId: string, userId: string, craftApiUrl: string, craftApiToken: string) {
  console.log('syncCalendarEvents called with:', { calendarId, userId, craftApiUrl: craftApiUrl ? 'present' : 'missing', craftApiToken: craftApiToken ? 'present' : 'missing' })

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const providerToken = session?.provider_token

  console.log('Provider token present:', !!providerToken)

  if (!providerToken) {
    throw new Error('No provider token found')
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  oauth2Client.setCredentials({ access_token: providerToken })
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  try {
    // Fetch events from the next 7 days
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    console.log(`Fetching events from ${now.toISOString()} to ${weekFromNow.toISOString()}`)

    const response = await calendar.events.list({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: weekFromNow.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    })

    const events = response.data.items || []
    console.log(`Found ${events.length} events for calendar ${calendarId}`)
    if (events.length > 0) {
      console.log('Event summaries:', events.map(e => e.summary))
    }

    if (events.length === 0) {
      console.log('No events found in the date range')
      return { synced: 0 }
    }

    // Initialize Craft client with validation
    console.log('Initializing Craft client with:', {
      apiUrl: craftApiUrl,
      tokenLength: craftApiToken?.length,
      tokenPresent: !!craftApiToken
    })
    const craftClient = new CraftClient(craftApiToken, craftApiUrl)

    // Check which events already exist in our database
    const eventIds = events.map(e => e.id!).filter(Boolean)
    console.log('Checking for existing events:', eventIds)

    const { data: existingMappings, error: queryError } = await supabase
      .from('event_mappings')
      .select('google_event_id, craft_block_id')
      .eq('user_id', userId)
      .in('google_event_id', eventIds)

    if (queryError) {
      console.error('Error querying existing mappings:', queryError)
    }

    console.log('Existing mappings found:', existingMappings)
    const existingEventIds = new Set(existingMappings?.map(m => m.google_event_id) || [])
    console.log(`Found ${existingEventIds.size} existing events, ${events.length - existingEventIds.size} new events to sync`)
    console.log('Existing event IDs:', Array.from(existingEventIds))

    // Filter to only new events that haven't been synced yet
    const newEvents = events.filter(event => !existingEventIds.has(event.id!))
    console.log('New events to sync:', newEvents.map(e => ({ id: e.id, summary: e.summary })))

    if (newEvents.length === 0) {
      console.log('No new events to sync')
      return { synced: 0 }
    }

    // Convert new events to Craft tasks
    const tasks = newEvents.map(event => {
      const title = event.summary || 'Untitled Event'
      const location = event.location ? ` @ ${event.location}` : ''

      // Handle all-day events vs timed events
      let scheduleDate: string | undefined
      let startTime: string

      if (event.start?.date) {
        // All-day event - date is in YYYY-MM-DD format already
        scheduleDate = event.start.date
        startTime = 'All Day'
      } else if (event.start?.dateTime) {
        // Timed event - dateTime is in ISO format with timezone
        const eventDateTime = new Date(event.start.dateTime)

        // Format date as YYYY-MM-DD in the event's timezone
        scheduleDate = event.start.dateTime.split('T')[0]

        // Format time in 12-hour format with AM/PM
        const hours = eventDateTime.getHours()
        const minutes = eventDateTime.getMinutes()
        const ampm = hours >= 12 ? 'PM' : 'AM'
        const displayHours = hours % 12 || 12
        const displayMinutes = minutes.toString().padStart(2, '0')
        startTime = `${displayHours}:${displayMinutes} ${ampm}`
      } else {
        // No start time, skip this event
        scheduleDate = undefined
        startTime = 'No Time'
      }

      // Format as simple markdown - Craft will handle rendering
      const markdown = `${startTime} • ${title}${location}`

      return {
        markdown,
        taskInfo: {
          state: 'todo' as const,
          scheduleDate,
        },
        location: {
          type: 'dailyNote' as const,
          dailyNoteDate: scheduleDate, // Place task in the daily note for that date
        },
      }
    })

    // Create tasks in Craft using Tasks API
    const result = await craftClient.createTasks(tasks)
    console.log(`Created ${result.items?.length || 0} new tasks in Craft`)

    // Save event mappings to database with the returned block IDs
    const createdBlocks = result.items || []
    const mappings = newEvents.map((event, index) => ({
      user_id: userId,
      google_calendar_id: calendarId,
      google_event_id: event.id!,
      craft_block_id: createdBlocks[index]?.id || null,
      event_date: event.start?.dateTime || event.start?.date || null,
    }))

    console.log('Saving mappings to database:', mappings)
    const { error: insertError } = await supabase.from('event_mappings').insert(mappings)

    if (insertError) {
      console.error('Error inserting event mappings:', insertError)
      throw new Error(`Failed to save event mappings: ${insertError.message}`)
    }

    console.log('Successfully saved event mappings')

    // Log the sync
    await supabase.from('sync_logs').insert({
      user_id: userId,
      calendar_id: calendarId,
      status: 'success',
      details: { eventsProcessed: newEvents.length, totalEvents: events.length },
    })

    return { synced: newEvents.length }
  } catch (error) {
    console.error('Error syncing events:', error)
    
    // Log the error
    await supabase.from('sync_logs').insert({
      user_id: userId,
      calendar_id: calendarId,
      status: 'error',
      details: { error: String(error) },
    })

    throw error
  }
}

export async function watchCalendar(calendarId: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const providerToken = session?.provider_token
  const providerRefreshToken = session?.provider_refresh_token

  if (!providerToken || !session?.user) {
    throw new Error('No provider token found')
  }

  // Get user's Craft API credentials
  const settings = await getUserSettings()
  if (!settings?.craft_api_url || !settings?.craft_api_token) {
    throw new Error('Craft API not configured. Please complete onboarding.')
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  oauth2Client.setCredentials({ access_token: providerToken })
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const webhookUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/google-calendar-webhook`
  
  // Generate a valid channel ID (must match [A-Za-z0-9\-_\+/=]+)
  const channelId = crypto.randomUUID()

  try {
    // First, perform initial sync of existing events
    console.log('Performing initial sync of calendar events...')
    const syncResult = await syncCalendarEvents(
      calendarId,
      session.user.id,
      settings.craft_api_url,
      settings.craft_api_token
    )
    console.log(`Initial sync complete: ${syncResult.synced} events synced`)

    // Then set up webhook for future changes
    const response = await calendar.events.watch({
      calendarId,
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
      },
    })

    // Save watch info AND tokens to database
    await supabase.from('calendars').upsert({
      user_id: session.user.id,
      google_calendar_id: calendarId,
      is_enabled: true,
      watch_channel_id: channelId,
      watch_resource_id: response.data.resourceId,
      watch_expiration: response.data.expiration ? new Date(parseInt(response.data.expiration)).toISOString() : null,
      access_token: providerToken,
      refresh_token: providerRefreshToken,
    }, { onConflict: 'user_id, google_calendar_id' })

    return { success: true, synced: syncResult.synced }
  } catch (error) {
    console.error('Error watching calendar:', error)
    throw error
  }
}

export async function syncAllCalendars() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get user's Craft API credentials
  const settings = await getUserSettings()
  if (!settings?.craft_api_url || !settings?.craft_api_token) {
    throw new Error('Craft API not configured. Please complete onboarding.')
  }

  // Get all enabled calendars for the user
  const { data: calendars, error } = await supabase
    .from('calendars')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_enabled', true)

  if (error) {
    console.error('Error fetching calendars:', error)
    throw error
  }

  if (!calendars || calendars.length === 0) {
    console.log('No enabled calendars found')
    return { synced: 0, calendars: 0 }
  }

  console.log(`Found ${calendars.length} enabled calendars to sync:`, calendars.map(c => ({
    id: c.google_calendar_id,
    summary: c.summary
  })))

  let totalSynced = 0

  // Sync each calendar
  for (const calendar of calendars) {
    try {
      console.log(`\n=== Syncing calendar: ${calendar.google_calendar_id} (${calendar.summary}) ===`)
      const result = await syncCalendarEvents(
        calendar.google_calendar_id,
        user.id,
        settings.craft_api_url,
        settings.craft_api_token
      )
      console.log(`=== Finished syncing ${calendar.google_calendar_id}: ${result.synced} events synced ===\n`)
      totalSynced += result.synced
    } catch (error) {
      console.error(`Error syncing calendar ${calendar.google_calendar_id}:`, error)
      // Continue with other calendars even if one fails
    }
  }

  console.log(`Total synced across all calendars: ${totalSynced}`)
  return { synced: totalSynced, calendars: calendars.length }
}

export async function stopWatchCalendar(calendarId: string, resourceId: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const providerToken = session?.provider_token

  if (!providerToken) {
    throw new Error('No provider token found')
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  oauth2Client.setCredentials({ access_token: providerToken })
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  try {
    await calendar.channels.stop({
      requestBody: {
        id: calendarId, // Channel ID
        resourceId: resourceId,
      },
    })

    // Update database
    await supabase.from('calendars').update({
      is_enabled: false,
      watch_resource_id: null,
      watch_expiration: null,
    }).eq('user_id', session?.user.id).eq('google_calendar_id', calendarId)

    return { success: true }
  } catch (error) {
    console.error('Error stopping watch:', error)
    throw error
  }
}

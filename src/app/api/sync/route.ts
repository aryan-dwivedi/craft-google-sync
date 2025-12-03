import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'
import { google } from 'googleapis'
import { CraftClient, CraftTask } from '@/lib/craft'
import { setupOAuthClientWithRefresh } from '@/lib/google-auth'

export async function POST(request: Request) {
  const { channelId } = await request.json()

  if (!channelId) {
    return NextResponse.json({ error: 'Missing channelId' }, { status: 400 })
  }

  // Use service role client to bypass RLS for webhook authentication
  const supabase = createServiceClient()

  // Fetch calendar and tokens by watch channel ID
  // Note: We need to use the service role to bypass RLS since webhooks aren't authenticated as users
  const { data: calendars, error: calError } = await supabase
    .from('calendars')
    .select('*')
    .eq('watch_channel_id', channelId)
    .eq('is_enabled', true)

  if (calError || !calendars || calendars.length === 0) {
    console.error('Calendar lookup error:', calError)
    return NextResponse.json({
      error: 'Calendar not found',
      details: calError?.message || 'No enabled calendar with this channel ID'
    }, { status: 404 })
  }

  // Use the first matching calendar (should only be one due to unique constraint)
  const calendar = calendars[0]

  if (!calendar.access_token) {
    return NextResponse.json({ error: 'No access token' }, { status: 401 })
  }

  if (!calendar.refresh_token) {
    return NextResponse.json({
      error: 'No refresh token available. Please reconnect your Google account.',
      details: 'Refresh token is required for automatic token renewal'
    }, { status: 401 })
  }

  // Setup Google Calendar API with automatic token refresh
  const oauth2Client = await setupOAuthClientWithRefresh(
    calendar.access_token,
    calendar.refresh_token,
    calendar.user_id,
    calendar.google_calendar_id
  )

  const calendarAPI = google.calendar({ version: 'v3', auth: oauth2Client })

  try {
    // Fetch events from today onwards
    const now = new Date()
    const response = await calendarAPI.events.list({
      calendarId: calendar.google_calendar_id,
      timeMin: now.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    })

    const events = response.data.items || []

    // Get user's Craft API credentials
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('craft_api_url, craft_api_token')
      .eq('user_id', calendar.user_id)
      .single()

    if (!userSettings?.craft_api_token || !userSettings?.craft_api_url) {
      throw new Error('User Craft API credentials not configured')
    }

    // Initialize Craft client with user-specific credentials
    const craft = new CraftClient(userSettings.craft_api_token, userSettings.craft_api_url)

    // Get all existing event mappings for this user to detect deletions
    const { data: existingMappings } = await supabase
      .from('event_mappings')
      .select('*')
      .eq('user_id', calendar.user_id)

    // Create a set of current Google event IDs
    const currentEventIds = new Set(events.map(e => e.id).filter(Boolean))

    // Find mappings for events that no longer exist (deleted events)
    const deletedMappings = (existingMappings || []).filter(
      mapping => !currentEventIds.has(mapping.google_event_id)
    )

    // Delete Craft tasks for deleted events
    for (const mapping of deletedMappings) {
      if (mapping.craft_block_id) {
        try {
          await craft.deleteTasks([mapping.craft_block_id])
        } catch (deleteError) {
          console.error('Failed to delete Craft task:', deleteError)
        }
      }
      // Remove the mapping from the database
      await supabase
        .from('event_mappings')
        .delete()
        .eq('id', mapping.id)
    }

    // Process each event
    for (const event of events) {
      if (!event.id || !event.summary) continue

      // Handle all-day events vs timed events
      let eventDate: string
      let startTime: string

      if (event.start?.date) {
        // All-day event - date is in YYYY-MM-DD format already
        eventDate = event.start.date
        startTime = 'All Day'
      } else if (event.start?.dateTime) {
        // Timed event - dateTime is in ISO format with timezone
        const eventDateTime = new Date(event.start.dateTime)

        // Format date as YYYY-MM-DD in the event's timezone
        eventDate = event.start.dateTime.split('T')[0]

        // Format time in 12-hour format with AM/PM
        const hours = eventDateTime.getHours()
        const minutes = eventDateTime.getMinutes()
        const ampm = hours >= 12 ? 'PM' : 'AM'
        const displayHours = hours % 12 || 12
        const displayMinutes = minutes.toString().padStart(2, '0')
        startTime = `${displayHours}:${displayMinutes} ${ampm}`
      } else {
        continue // Skip events without start time
      }

      // Check if we already have this event mapped
      const { data: existing } = await supabase
        .from('event_mappings')
        .select('*')
        .eq('user_id', calendar.user_id)
        .eq('google_event_id', event.id)
        .single()

      const taskMarkdown = `${startTime} • ${event.summary}${event.location ? ` @ ${event.location}` : ''}`

      const craftTask: CraftTask = {
        markdown: taskMarkdown,
        taskInfo: {
          state: 'todo',
          scheduleDate: eventDate,
        },
        location: {
          type: 'dailyNote' as const,
          dailyNoteDate: eventDate,
        },
      }

      if (existing) {
        // Update existing task
        if (existing.craft_block_id) {
          craftTask.id = existing.craft_block_id
          await craft.updateTasks([craftTask])
        }
      } else {
        // Create new task
        const result = await craft.createTasks([craftTask])

        // Save mapping
        await supabase.from('event_mappings').insert({
          user_id: calendar.user_id,
          google_event_id: event.id,
          craft_block_id: result.items?.[0]?.id || null,
          event_date: eventDate,
        })
      }
    }

    // Log success
    await supabase.from('sync_logs').insert({
      user_id: calendar.user_id,
      status: 'success',
      details: {
        channelId,
        calendarId: calendar.google_calendar_id,
        eventsProcessed: events.length,
        eventsDeleted: deletedMappings.length
      },
    })

    return NextResponse.json({ success: true, eventsProcessed: events.length, eventsDeleted: deletedMappings.length })
  } catch (error) {
    console.error('Sync error:', error)

    await supabase.from('sync_logs').insert({
      user_id: calendar.user_id,
      status: 'error',
      details: {
        channelId,
        calendarId: calendar.google_calendar_id,
        error: String(error)
      },
    })

    return NextResponse.json({ error: 'Sync failed', details: String(error) }, { status: 500 })
  }
}

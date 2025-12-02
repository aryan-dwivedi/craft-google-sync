import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { google } from 'googleapis'
import { CraftClient, CraftTask } from '@/lib/craft'

export async function POST(request: Request) {
  const { channelId } = await request.json()

  if (!channelId) {
    return NextResponse.json({ error: 'Missing channelId' }, { status: 400 })
  }

  const supabase = await createClient()

  // Fetch calendar and tokens by watch channel ID
  const { data: calendar, error: calError } = await supabase
    .from('calendars')
    .select('*')
    .eq('watch_channel_id', channelId)
    .single()

  if (calError || !calendar) {
    console.error('Calendar lookup error:', calError)
    return NextResponse.json({ error: 'Calendar not found', details: calError?.message }, { status: 404 })
  }

  if (!calendar.access_token) {
    return NextResponse.json({ error: 'No access token' }, { status: 401 })
  }

  // Setup Google Calendar API
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  
  oauth2Client.setCredentials({ 
    access_token: calendar.access_token,
    refresh_token: calendar.refresh_token 
  })

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

    // Initialize Craft client
    const craftToken = process.env.CRAFT_API_TOKEN
    if (!craftToken) {
      throw new Error('CRAFT_API_TOKEN not configured')
    }
    const craft = new CraftClient(craftToken)

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
      details: { channelId, eventsProcessed: events.length, eventsDeleted: deletedMappings.length },
    })

    return NextResponse.json({ success: true, eventsProcessed: events.length, eventsDeleted: deletedMappings.length })
  } catch (error) {
    console.error('Sync error:', error)
    
    await supabase.from('sync_logs').insert({
      user_id: calendar.user_id,
      status: 'error',
      details: { channelId, error: String(error) },
    })

    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

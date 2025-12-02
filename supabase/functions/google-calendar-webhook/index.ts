import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const channelId = req.headers.get('x-goog-channel-id')
    const resourceId = req.headers.get('x-goog-resource-id')
    const resourceState = req.headers.get('x-goog-resource-state')

    console.log('Webhook received:', { channelId, resourceId, resourceState })

    if (!channelId) {
      return new Response('Missing channel ID', { status: 400 })
    }

    // Acknowledge sync messages immediately
    if (resourceState === 'sync') {
      console.log('Sync acknowledgment for channel:', channelId)
      return new Response('Sync OK', { status: 200 })
    }

    // For actual change notifications, trigger the sync endpoint
    // This makes a POST request to your app's /api/sync endpoint
    const appUrl = Deno.env.get('APP_URL') || Deno.env.get('NEXT_PUBLIC_APP_URL')

    if (!appUrl) {
      console.error('APP_URL not configured in environment variables')
      return new Response('Configuration error', { status: 500 })
    }

    console.log(`Triggering sync for channel ${channelId} via ${appUrl}/api/sync`)

    // Call your app's sync endpoint
    const syncResponse = await fetch(`${appUrl}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channelId }),
    })

    let syncResult
    const contentType = syncResponse.headers.get('content-type')

    if (contentType && contentType.includes('application/json')) {
      syncResult = await syncResponse.json()
    } else {
      const textResponse = await syncResponse.text()
      console.error('Non-JSON response from sync endpoint:', textResponse.substring(0, 200))
      syncResult = { error: 'Invalid response format', response: textResponse.substring(0, 200) }
    }

    console.log('Sync result:', syncResult)

    if (!syncResponse.ok) {
      console.error('Sync failed:', syncResult)
      return new Response(JSON.stringify({ error: 'Sync failed', details: syncResult }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, result: syncResult }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

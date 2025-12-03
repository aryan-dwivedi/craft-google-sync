'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { listGoogleCalendarsWithToken, watchCalendar } from '@/app/actions/calendar'
import { createClient } from '@/utils/supabase/client'
import { Loader2 } from 'lucide-react'

interface CalendarSelectStepProps {
  onNext: () => void
  onBack: () => void
}

export function CalendarSelectStep({ onNext, onBack }: CalendarSelectStepProps) {
  const [calendars, setCalendars] = useState<any[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.provider_token) {
          console.error('No provider token available')
          setError('Google connection expired. Please go back and reconnect.')
          setLoading(false)
          return
        }

        const cals = await listGoogleCalendarsWithToken(session.provider_token)
        setCalendars(cals)
      } catch (e) {
        console.error('Error loading calendars:', e)
        setError('Failed to load calendars. Please try reconnecting.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleToggle = (calendarId: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(calendarId)) {
      newSelected.delete(calendarId)
    } else {
      newSelected.add(calendarId)
    }
    setSelected(newSelected)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      for (const calId of selected) {
        await watchCalendar(calId)
      }
      onNext()
    } catch (e) {
      console.error('Error watching calendar:', e)
      setError(e instanceof Error ? e.message : 'Failed to set up calendar sync. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-[#3c2cd4]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">Connection Issue</h2>
          <p className="text-red-600">{error}</p>
        </div>
        <div className="flex items-center justify-center pt-6">
          <Button 
            onClick={onBack} 
            variant="outline" 
            size="lg"
            className="border-2 hover:bg-gray-50"
          >
            Go Back to Reconnect
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Select Calendars to Sync</h2>
        <p className="text-gray-600">
          Choose which calendars you want to sync to Craft
        </p>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {calendars.map((cal) => (
          <div
            key={cal.id}
            className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => handleToggle(cal.id)}
          >
            <Checkbox
              checked={selected.has(cal.id)}
              onCheckedChange={() => handleToggle(cal.id)}
            />
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: cal.backgroundColor || '#ccc' }}
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{cal.summary}</p>
              <p className="text-sm text-gray-500">{cal.id}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-6">
        <Button 
          onClick={onBack} 
          variant="outline" 
          size="lg"
          className="border-2 hover:bg-gray-50"
        >
          Back
        </Button>
        <Button
          onClick={handleSave}
          disabled={selected.size === 0 || saving}
          size="lg"
          className="bg-gradient-to-r from-[#3c2cd4] to-[#5b4de8] hover:from-[#2f23a8] hover:to-[#4a3ec7] text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Setting up...
            </>
          ) : (
            `Continue with ${selected.size} calendar${selected.size !== 1 ? 's' : ''}`
          )}
        </Button>
      </div>
    </div>
  )
}

import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { ArrowRight } from 'lucide-react'

interface GoogleConnectStepProps {
  onNext: () => void
  onBack: () => void
}

export function GoogleConnectStep({ onNext, onBack }: GoogleConnectStepProps) {
  const handleConnect = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/onboarding?step=4`,
        scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }

  return (
    <div className="text-center space-y-8 max-w-2xl mx-auto py-8">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">Connect Google Calendar</h2>
        <p className="text-gray-600 text-lg">
          We need access to your Google Calendar to sync events to Craft
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-8 space-y-4">
        <h3 className="font-semibold text-gray-900">We'll request permission to:</h3>
        <ul className="text-left space-y-2 text-gray-700">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>View your calendar events</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Receive notifications when events change</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Access your calendar list</span>
          </li>
        </ul>
        <p className="text-sm text-gray-500 pt-4">
          We never modify or delete your calendar events
        </p>
      </div>

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
          onClick={handleConnect}
          size="lg"
          className="bg-gradient-to-r from-[#3c2cd4] to-[#5b4de8] hover:from-[#2f23a8] hover:to-[#4a3ec7] text-white shadow-lg hover:shadow-xl transition-all"
        >
          Connect Google Calendar
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}

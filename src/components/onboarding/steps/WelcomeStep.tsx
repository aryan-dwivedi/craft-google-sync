import { Button } from '@/components/ui/button'
import { Calendar, Sparkles, Zap } from 'lucide-react'

interface WelcomeStepProps {
  onNext: () => void
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center space-y-8 py-8">
      <div className="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-[#3c2cd4] to-[#fbdbb4] flex items-center justify-center shadow-lg">
        <Calendar className="w-12 h-12 text-white" />
      </div>

      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Welcome to Craft Sync</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Automatically sync your Google Calendar events to Craft as tasks. 
          Never miss a meeting or deadline again.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto pt-8">
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto">
            <Zap className="w-6 h-6 text-[#3c2cd4]" />
          </div>
          <h3 className="font-semibold text-gray-900">Real-time Sync</h3>
          <p className="text-sm text-gray-600">
            Events sync automatically via webhooks
          </p>
        </div>

        <div className="space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6 text-[#3c2cd4]" />
          </div>
          <h3 className="font-semibold text-gray-900">Multi-Calendar</h3>
          <p className="text-sm text-gray-600">
            Sync multiple calendars at once
          </p>
        </div>

        <div className="space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6 text-[#3c2cd4]" />
          </div>
          <h3 className="font-semibold text-gray-900">Smart Tasks</h3>
          <p className="text-sm text-gray-600">
            Events become actionable tasks
          </p>
        </div>
      </div>

      <div className="pt-8">
        <Button
          onClick={onNext}
          size="lg"
          className="bg-gradient-to-r from-[#3c2cd4] to-[#5b4de8] hover:from-[#2f23a8] hover:to-[#4a3ec7] text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          Get Started
        </Button>
      </div>
    </div>
  )
}

import { Button } from '@/components/ui/button'
import { completeOnboarding } from '@/app/actions/settings'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Sparkles } from 'lucide-react'

interface CompleteStepProps {
  onBack: () => void
}

export function CompleteStep({ onBack }: CompleteStepProps) {
  const router = useRouter()

  const handleComplete = async () => {
    await completeOnboarding()
    router.push('/dashboard')
  }

  return (
    <div className="text-center space-y-8 py-8">
      <div className="mx-auto w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
      </div>

      <div className="space-y-4">
        <h2 className="text-4xl font-bold text-gray-900">You're All Set!</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your calendars are now syncing to Craft. Events will appear as tasks automatically.
        </p>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-8 max-w-2xl mx-auto">
        <div className="flex items-start space-x-4">
          <Sparkles className="w-6 h-6 text-[#3c2cd4] flex-shrink-0 mt-1" />
          <div className="text-left space-y-2">
            <h3 className="font-semibold text-gray-900">What happens next?</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• Your calendar events will sync to Craft in real-time</li>
              <li>• New events will automatically create tasks</li>
              <li>• Changes to events will update the corresponding tasks</li>
              <li>• You can manage your sync settings anytime from the dashboard</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="pt-8">
        <Button
          onClick={handleComplete}
          size="lg"
          className="bg-gradient-to-r from-[#3c2cd4] to-[#5b4de8] hover:from-[#2f23a8] hover:to-[#4a3ec7] text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}

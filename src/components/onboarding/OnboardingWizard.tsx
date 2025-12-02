'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { WelcomeStep } from './steps/WelcomeStep'
import { CraftConfigStep } from './steps/CraftConfigStep'
import { GoogleConnectStep } from './steps/GoogleConnectStep'
import { CalendarSelectStep } from './steps/CalendarSelectStep'
import { CompleteStep } from './steps/CompleteStep'
import { Card } from '@/components/ui/card'
import { Check } from 'lucide-react'

const STEPS = [
  { id: 1, name: 'Welcome', component: WelcomeStep },
  { id: 2, name: 'Craft Setup', component: CraftConfigStep },
  { id: 3, name: 'Connect Google', component: GoogleConnectStep },
  { id: 4, name: 'Select Calendars', component: CalendarSelectStep },
  { id: 5, name: 'Complete', component: CompleteStep },
]

export function OnboardingWizard() {
  const searchParams = useSearchParams()
  const stepParam = searchParams.get('step')
  const [currentStep, setCurrentStep] = useState(stepParam ? parseInt(stepParam) : 1)
  const [craftConfig, setCraftConfig] = useState({ url: '', token: '' })

  // Update step when URL changes (after OAuth redirect)
  useEffect(() => {
    if (stepParam) {
      const step = parseInt(stepParam)
      if (step >= 1 && step <= STEPS.length) {
        setCurrentStep(step)
      }
    }
  }, [stepParam])

  const CurrentStepComponent = STEPS.find(s => s.id === currentStep)?.component

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2d2a5c] via-[#3c2cd4] to-[#2d2a5c] flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-white/95 backdrop-blur-xl shadow-2xl border-0">
        {/* Progress Steps */}
        <div className="border-b border-gray-200 px-8 pt-8 pb-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : currentStep === step.id
                        ? 'bg-[#3c2cd4] text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                  </div>
                  <span className="text-xs mt-2 font-medium text-gray-600">{step.name}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-16 mx-2 transition-all ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-8">
          {CurrentStepComponent && (
            <CurrentStepComponent
              onNext={handleNext}
              onBack={handleBack}
              craftConfig={craftConfig}
              setCraftConfig={setCraftConfig}
            />
          )}
        </div>
      </Card>
    </div>
  )
}

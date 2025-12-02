import { getUserSettings } from '@/app/actions/settings'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

export default async function OnboardingPage() {
  const settings = await getUserSettings()
  
  if (settings?.onboarding_completed) {
    redirect('/dashboard')
  }

  return <OnboardingWizard />
}

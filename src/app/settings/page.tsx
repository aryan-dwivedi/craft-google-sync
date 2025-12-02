import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { createClient } from '@/utils/supabase/server'
import { getUserSettings } from '@/app/actions/settings'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const settings = await getUserSettings()

  return (
    <DashboardLayout userEmail={user?.email}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your application settings</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <SettingsClient initialSettings={settings} userEmail={user?.email} />
        </div>
      </div>
    </DashboardLayout>
  )
}

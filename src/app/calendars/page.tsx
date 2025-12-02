import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

export default async function CalendarsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <DashboardLayout userEmail={user?.email}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Calendars</h1>
            <p className="text-gray-600 mt-1">Manage your connected calendars</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Calendar Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                This page will show detailed calendar management options.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

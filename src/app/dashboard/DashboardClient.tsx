'use client'

import { listGoogleCalendars, watchCalendar, syncAllCalendars } from '@/app/actions/calendar'
import { getConnectionStatus, getSyncLogs } from '@/app/actions/status'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { Calendar, CheckCircle2, XCircle, Zap, RefreshCw, TrendingUp, Clock, AlertCircle } from 'lucide-react'

interface DashboardClientProps {
  userEmail?: string
}

export function DashboardClient({ userEmail }: DashboardClientProps) {
  const [calendars, setCalendars] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState({ google: false, craft: false })
  const [logs, setLogs] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, synced: 0, lastSync: 'Never' })
  const [syncing, setSyncing] = useState<Set<string>>(new Set())
  const [syncingAll, setSyncingAll] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [cals, connectionStatus, syncLogs] = await Promise.all([
          listGoogleCalendars(),
          getConnectionStatus(),
          getSyncLogs(5),
        ])

        setCalendars(cals.map(c => ({ ...c, syncing: false })))
        setStatus(connectionStatus)
        setLogs(syncLogs)
        setStats({
          total: cals.length,
          synced: 0,
          lastSync: syncLogs[0] ? new Date(syncLogs[0].created_at).toLocaleTimeString() : 'Never'
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleToggle = async (calendarId: string, checked: boolean) => {
    if (!checked) return

    setSyncing(prev => new Set(prev).add(calendarId))
    try {
      const result = await watchCalendar(calendarId)
      setCalendars(cals => cals.map(c =>
        c.id === calendarId ? { ...c, syncing: true } : c
      ))

      // Show success message
      if (result.synced) {
        console.log(`✅ Synced ${result.synced} events from calendar`)
      }
    } catch (e) {
      console.error(e)
      alert('Failed to sync calendar. Please check your Craft API configuration.')
    } finally {
      setSyncing(prev => {
        const next = new Set(prev)
        next.delete(calendarId)
        return next
      })
    }
  }

  const handleSyncAll = async () => {
    setSyncingAll(true)
    try {
      console.log('Starting sync...')
      const result = await syncAllCalendars()
      console.log('Sync result:', result)

      // Reload logs after sync
      const syncLogs = await getSyncLogs(5)
      setLogs(syncLogs)

      // Update stats
      setStats(prev => ({
        ...prev,
        synced: result.synced,
        lastSync: new Date().toLocaleTimeString()
      }))

      // Show success message
      if (result.synced > 0) {
        alert(`✅ Successfully synced ${result.synced} events from ${result.calendars} calendar(s)`)
      } else {
        alert(`ℹ️ No new events to sync. Total calendars checked: ${result.calendars}`)
      }
    } catch (e) {
      console.error('Sync error:', e)
      alert(`Failed to sync calendars: ${e instanceof Error ? e.message : 'Unknown error'}. Check console for details.`)
    } finally {
      setSyncingAll(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout userEmail={userEmail}>
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center space-y-4">
            <RefreshCw className="w-12 h-12 animate-spin text-[#3c2cd4]" />
            <p className="text-gray-600 font-medium">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userEmail={userEmail}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-lg bg-white/80">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                <p className="text-gray-600 mt-1">Manage your calendar sync settings</p>
              </div>
              <Button
                className="bg-[#3c2cd4] hover:bg-[#2f23a8] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 rounded-full px-6"
                size="lg"
                onClick={handleSyncAll}
                disabled={syncingAll}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncingAll ? 'animate-spin' : ''}`} />
                {syncingAll ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Calendars */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-blue-100 text-sm font-medium">Total Calendars</p>
                    <p className="text-4xl font-bold">{stats.total}</p>
                    <p className="text-blue-100 text-xs">Connected accounts</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Calendar className="w-7 h-7" />
                  </div>
                </div>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              </CardContent>
            </Card>

            {/* Events Synced */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden relative">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-purple-100 text-sm font-medium">Events Synced Today</p>
                    <p className="text-4xl font-bold">{stats.synced}</p>
                    <div className="flex items-center space-x-1 text-purple-100 text-xs">
                      <TrendingUp className="w-3 h-3" />
                      <span>+12 from yesterday</span>
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Zap className="w-7 h-7" />
                  </div>
                </div>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              </CardContent>
            </Card>

            {/* Last Sync */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-green-500 to-green-600 text-white overflow-hidden relative">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-green-100 text-sm font-medium">Last Sync</p>
                    <p className="text-2xl font-bold">{stats.lastSync}</p>
                    <p className="text-green-100 text-xs">All systems operational</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Clock className="w-7 h-7" />
                  </div>
                </div>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              </CardContent>
            </Card>
          </div>

          {/* Connection Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className={`border-2 transition-all ${
              status.google 
                ? 'border-green-200 bg-gradient-to-br from-green-50 to-white shadow-lg' 
                : 'border-red-200 bg-gradient-to-br from-red-50 to-white shadow-lg'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      status.google ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {status.google ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : (
                        <XCircle className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">Google Calendar</p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {status.google ? 'Connected and syncing' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  {status.google && (
                    <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className={`border-2 transition-all ${
              status.craft 
                ? 'border-green-200 bg-gradient-to-br from-green-50 to-white shadow-lg' 
                : 'border-red-200 bg-gradient-to-br from-red-50 to-white shadow-lg'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      status.craft ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {status.craft ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">Craft</p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {status.craft ? 'API configured' : 'Not configured'}
                      </p>
                    </div>
                  </div>
                  {!status.craft && (
                    <Button variant="outline" size="sm" className="rounded-full">
                      Configure
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendars Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Your Calendars</h2>
              <p className="text-sm text-gray-600">{calendars.length} calendar{calendars.length !== 1 ? 's' : ''} found</p>
            </div>

            {calendars.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No calendars found</h3>
                  <p className="text-gray-600 mb-6">Connect your Google account to get started</p>
                  <Button className="bg-[#3c2cd4] hover:bg-[#2f23a8] text-white rounded-full">
                    Connect Calendar
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {calendars.map((cal) => (
                  <Card 
                    key={cal.id} 
                    className="border-0 shadow-md hover:shadow-lg transition-all bg-white overflow-hidden group"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 transition-transform group-hover:scale-110"
                            style={{ backgroundColor: cal.backgroundColor || '#6366f1' }}
                          >
                            <Calendar className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-lg truncate">{cal.summary}</h3>
                            <p className="text-sm text-gray-500 truncate mt-0.5">{cal.id}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <div className="flex items-center space-x-1.5 text-xs text-gray-500">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Last synced: Just now</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 flex-shrink-0">
                          <Badge 
                            variant={cal.syncing ? 'default' : 'secondary'}
                            className={cal.syncing ? 'bg-green-100 text-green-700 border-green-200' : ''}
                          >
                            {cal.syncing ? 'Active' : 'Inactive'}
                          </Badge>
                          <Switch
                            checked={cal.syncing}
                            onCheckedChange={(checked) => handleToggle(cal.id, checked)}
                            disabled={syncing.has(cal.id)}
                            className="data-[state=checked]:bg-[#3c2cd4]"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          {logs.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
                  <div className="space-y-6">
                    {logs.map((log) => (
                      <div key={log.id} className="relative flex items-start space-x-4 pl-14">
                        <div className={`absolute left-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                          log.status === 'success' ? 'bg-green-500' : 
                          log.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                        }`}>
                          {log.status === 'success' ? (
                            <CheckCircle2 className="w-6 h-6 text-white" />
                          ) : log.status === 'error' ? (
                            <XCircle className="w-6 h-6 text-white" />
                          ) : (
                            <Clock className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-gray-900 capitalize">{log.status}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                {log.details?.eventsProcessed 
                                  ? `Synced ${log.details.eventsProcessed} events`
                                  : 'Webhook received'}
                              </p>
                            </div>
                            <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
                              {new Date(log.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

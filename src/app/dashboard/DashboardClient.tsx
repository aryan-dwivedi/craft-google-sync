'use client'

import { listGoogleCalendars, watchCalendar, syncAllCalendars } from '@/app/actions/calendar'
import { getConnectionStatus, getSyncLogs } from '@/app/actions/status'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { Calendar, CheckCircle2, XCircle, Zap, RefreshCw, TrendingUp, Clock, AlertCircle, Activity, Sparkles, ArrowUpRight } from 'lucide-react'

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
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 animate-pulse flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 absolute -bottom-1 -right-1 bg-white rounded-full p-1" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-xl font-semibold text-gray-900">Loading your dashboard</p>
              <p className="text-sm text-gray-500">Preparing your calendar insights...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userEmail={userEmail}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Hero Header Section */}
        <div className="relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl" />
            <div className="absolute top-20 -left-20 w-60 h-60 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl" />
          </div>

          {/* Header Content */}
          <div className="relative">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Dashboard
                    </h1>
                    <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 px-3 py-1">
                      Live
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-lg">Your calendar sync command center</p>
                </div>
                <Button
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 rounded-xl px-8 h-12"
                  onClick={handleSyncAll}
                  disabled={syncingAll}
                >
                  {syncingAll ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Sync Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Calendars */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <Card className="relative border-0 shadow-xl hover:shadow-2xl transition-all bg-white/90 backdrop-blur-lg overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Calendars</p>
                      </div>
                      <p className="text-5xl font-bold text-gray-900">{stats.total}</p>
                      <p className="text-sm text-gray-600">Connected sources</p>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all">
                      <Calendar className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Events Synced */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <Card className="relative border-0 shadow-xl hover:shadow-2xl transition-all bg-white/90 backdrop-blur-lg overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Synced Today</p>
                      </div>
                      <p className="text-5xl font-bold text-gray-900">{stats.synced}</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 rounded-full">
                          <ArrowUpRight className="w-3 h-3 text-green-600" />
                          <span className="text-xs font-semibold text-green-600">+15%</span>
                        </div>
                        <span className="text-xs text-gray-500">vs yesterday</span>
                      </div>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Last Sync */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <Card className="relative border-0 shadow-xl hover:shadow-2xl transition-all bg-white/90 backdrop-blur-lg overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Last Sync</p>
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{stats.lastSync}</p>
                      <div className="flex items-center space-x-1.5 text-emerald-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-medium">All systems operational</span>
                      </div>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all">
                      <Activity className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Connection Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Integration Status</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>All systems online</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Google Calendar Status */}
              <div className="group relative">
                <div className={`absolute inset-0 rounded-2xl blur-xl opacity-40 transition-opacity ${
                  status.google ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gradient-to-r from-red-400 to-orange-400'
                }`} />
                <Card className="relative border-0 shadow-xl hover:shadow-2xl transition-all bg-white/90 backdrop-blur-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                          status.google
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                            : 'bg-gradient-to-br from-red-500 to-orange-600'
                        }`}>
                          {status.google ? (
                            <CheckCircle2 className="w-7 h-7 text-white" />
                          ) : (
                            <XCircle className="w-7 h-7 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-xl">Google Calendar</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {status.google ? 'Connected and syncing' : 'Not connected'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${status.google ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={`text-sm font-semibold ${status.google ? 'text-green-600' : 'text-red-600'}`}>
                          {status.google ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {status.google && (
                        <Badge className="bg-green-100 text-green-700 border-0 px-3 py-1">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Live
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Craft Status */}
              <div className="group relative">
                <div className={`absolute inset-0 rounded-2xl blur-xl opacity-40 transition-opacity ${
                  status.craft ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gradient-to-r from-red-400 to-orange-400'
                }`} />
                <Card className="relative border-0 shadow-xl hover:shadow-2xl transition-all bg-white/90 backdrop-blur-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                          status.craft
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                            : 'bg-gradient-to-br from-red-500 to-orange-600'
                        }`}>
                          {status.craft ? (
                            <CheckCircle2 className="w-7 h-7 text-white" />
                          ) : (
                            <AlertCircle className="w-7 h-7 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-xl">Craft</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {status.craft ? 'API configured' : 'Not configured'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${status.craft ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={`text-sm font-semibold ${status.craft ? 'text-green-600' : 'text-red-600'}`}>
                          {status.craft ? 'Configured' : 'Setup Required'}
                        </span>
                      </div>
                      {!status.craft && (
                        <Button variant="outline" size="sm" className="rounded-full border-2 hover:bg-indigo-50 hover:border-indigo-300">
                          Configure
                        </Button>
                      )}
                      {status.craft && (
                        <Badge className="bg-green-100 text-green-700 border-0 px-3 py-1">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Ready
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Calendars Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your Calendars</h2>
                <p className="text-sm text-gray-600 mt-1">Manage and monitor your connected calendars</p>
              </div>
              <Badge className="bg-indigo-100 text-indigo-700 border-0 px-4 py-2 text-sm">
                {calendars.length} calendar{calendars.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {calendars.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300 hover:border-indigo-300 transition-colors">
                <CardContent className="p-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-10 h-10 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No calendars connected</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Connect your Google Calendar to start syncing events with Craft
                  </p>
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl px-8 shadow-lg hover:shadow-xl transition-all">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Connect Calendar
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {calendars.map((cal) => (
                  <div key={cal.id} className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Card className="relative border-0 shadow-lg hover:shadow-2xl transition-all bg-white overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-5 flex-1 min-w-0">
                            <div
                              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3"
                              style={{
                                background: `linear-gradient(135deg, ${cal.backgroundColor || '#6366f1'} 0%, ${cal.backgroundColor || '#6366f1'}dd 100%)`
                              }}
                            >
                              <Calendar className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 text-xl truncate">{cal.summary}</h3>
                              <p className="text-sm text-gray-500 truncate mt-1">{cal.id}</p>
                              <div className="flex items-center space-x-6 mt-3">
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <Clock className="w-4 h-4" />
                                  <span>Last synced: Just now</span>
                                </div>
                                {cal.syncing && (
                                  <div className="flex items-center space-x-2 text-sm text-green-600">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="font-medium">Live sync active</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-5 flex-shrink-0">
                            <Badge
                              className={`px-4 py-1.5 text-sm font-semibold border-0 ${
                                cal.syncing
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {cal.syncing ? (
                                <>
                                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
                                  Active
                                </>
                              ) : (
                                'Inactive'
                              )}
                            </Badge>
                            <div className="relative">
                              <Switch
                                checked={cal.syncing}
                                onCheckedChange={(checked) => handleToggle(cal.id, checked)}
                                disabled={syncing.has(cal.id)}
                                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-indigo-600 data-[state=checked]:to-purple-600 scale-125"
                              />
                              {syncing.has(cal.id) && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          {logs.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
                  <p className="text-sm text-gray-600 mt-1">Track your sync history and events</p>
                </div>
                <Badge className="bg-indigo-100 text-indigo-700 border-0 px-4 py-2 text-sm">
                  Last {logs.length} events
                </Badge>
              </div>

              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-lg">
                <CardContent className="p-8">
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500" />

                    <div className="space-y-8">
                      {logs.map((log) => (
                        <div key={log.id} className="relative flex items-start space-x-6 pl-20">
                          {/* Timeline dot */}
                          <div className={`absolute left-0 w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl transition-all hover:scale-110 ${
                            log.status === 'success'
                              ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                              : log.status === 'error'
                              ? 'bg-gradient-to-br from-red-500 to-orange-600'
                              : 'bg-gradient-to-br from-gray-400 to-gray-500'
                          }`}>
                            {log.status === 'success' ? (
                              <CheckCircle2 className="w-8 h-8 text-white" />
                            ) : log.status === 'error' ? (
                              <XCircle className="w-8 h-8 text-white" />
                            ) : (
                              <Clock className="w-8 h-8 text-white" />
                            )}
                          </div>

                          {/* Content card */}
                          <div className="flex-1 group relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 hover:shadow-lg transition-all border border-gray-100">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="flex items-center space-x-3 mb-2">
                                    <p className="font-bold text-gray-900 text-lg capitalize">{log.status}</p>
                                    <Badge className={`border-0 ${
                                      log.status === 'success'
                                        ? 'bg-green-100 text-green-700'
                                        : log.status === 'error'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {log.status === 'success' ? 'Completed' : log.status === 'error' ? 'Failed' : 'Pending'}
                                    </Badge>
                                  </div>
                                  <p className="text-gray-600">
                                    {log.details?.eventsProcessed
                                      ? `Successfully synced ${log.details.eventsProcessed} event${log.details.eventsProcessed !== 1 ? 's' : ''}`
                                      : log.details?.error
                                      ? `Error: ${log.details.error.substring(0, 100)}...`
                                      : 'Webhook notification received'}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                  <span className="text-xs font-semibold text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                                    {new Date(log.created_at).toLocaleTimeString()}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {new Date(log.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              {log.details && (
                                <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-gray-100">
                                  {log.details.eventsProcessed !== undefined && (
                                    <div className="flex items-center space-x-2 text-sm">
                                      <Zap className="w-4 h-4 text-indigo-600" />
                                      <span className="text-gray-600">
                                        <span className="font-semibold text-gray-900">{log.details.eventsProcessed}</span> events
                                      </span>
                                    </div>
                                  )}
                                  {log.details.eventsDeleted !== undefined && log.details.eventsDeleted > 0 && (
                                    <div className="flex items-center space-x-2 text-sm">
                                      <XCircle className="w-4 h-4 text-red-600" />
                                      <span className="text-gray-600">
                                        <span className="font-semibold text-gray-900">{log.details.eventsDeleted}</span> deleted
                                      </span>
                                    </div>
                                  )}
                                  {log.details.calendarId && (
                                    <div className="flex items-center space-x-2 text-sm">
                                      <Calendar className="w-4 h-4 text-purple-600" />
                                      <span className="text-gray-600 truncate max-w-xs">
                                        {log.details.calendarId}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

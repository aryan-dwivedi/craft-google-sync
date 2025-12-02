import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, CheckCircle2, XCircle, Clock } from 'lucide-react'

interface ActivityTimelineProps {
  logs: any[]
}

export function ActivityTimeline({ logs }: ActivityTimelineProps) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">No activity yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
          
          <div className="space-y-6">
            {logs.map((log, index) => (
              <div key={log.id} className="relative flex items-start space-x-4 pl-10">
                {/* Timeline dot */}
                <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  log.status === 'success' ? 'bg-green-100' : 
                  log.status === 'error' ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  {log.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : log.status === 'error' ? (
                    <XCircle className="w-4 h-4 text-red-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-gray-600" />
                  )}
                </div>

                <div className="flex-1 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{log.status}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {log.details?.eventsProcessed 
                          ? `Synced ${log.details.eventsProcessed} events`
                          : 'Webhook received'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
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
  )
}

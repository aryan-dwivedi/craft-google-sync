'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock } from 'lucide-react'

interface CalendarCardProps {
  calendar: any
  onToggle: (id: string, checked: boolean) => void
}

export function CalendarCard({ calendar, onToggle }: CalendarCardProps) {
  return (
    <Card className="hover:shadow-md transition-all hover:scale-[1.01]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: calendar.backgroundColor || '#ccc' }}
            >
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{calendar.summary}</h3>
              <p className="text-sm text-gray-500 truncate">{calendar.id}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">Last synced: Just now</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant={calendar.syncing ? 'default' : 'secondary'}>
              {calendar.syncing ? 'Active' : 'Inactive'}
            </Badge>
            <Switch
              checked={calendar.syncing}
              onCheckedChange={(checked) => onToggle(calendar.id, checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

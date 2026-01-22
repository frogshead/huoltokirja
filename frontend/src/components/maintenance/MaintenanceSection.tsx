import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format, isPast, addDays, isFuture } from 'date-fns'
import { fi, enUS } from 'date-fns/locale'
import { Calendar, Clock, History, Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useMaintenanceHistory } from '@/api/maintenance'
import { LogMaintenanceForm } from './LogMaintenanceForm'
import { ScheduleForm } from './ScheduleForm'
import type { Item } from '@/api/types'

interface MaintenanceSectionProps {
  item: Item
}

function MaintenanceBadge({ item }: { item: Item }) {
  const { t } = useTranslation()

  if (!item.next_maintenance_at) {
    return <Badge variant="secondary">{t('maintenance.badge.noSchedule')}</Badge>
  }

  const nextDate = new Date(item.next_maintenance_at)
  if (isPast(nextDate)) {
    return <Badge variant="destructive">{t('maintenance.badge.overdue')}</Badge>
  }
  if (isFuture(nextDate) && nextDate <= addDays(new Date(), 7)) {
    return <Badge variant="warning">{t('maintenance.badge.dueSoon')}</Badge>
  }
  return <Badge variant="success">{t('maintenance.badge.ok')}</Badge>
}

export function MaintenanceSection({ item }: MaintenanceSectionProps) {
  const { t, i18n } = useTranslation()
  const { data: history = [], isLoading } = useMaintenanceHistory(item.id)
  const [logOpen, setLogOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)

  const dateLocale = i18n.language === 'fi' ? fi : enUS

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('maintenance.status')}
            </CardTitle>
            <MaintenanceBadge item={item} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('maintenance.lastMaintenance')}
              </p>
              <p className="text-lg">
                {item.last_maintenance_at
                  ? format(new Date(item.last_maintenance_at), 'PPP', { locale: dateLocale })
                  : t('maintenance.never')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('maintenance.nextMaintenance')}
              </p>
              <p className="text-lg">
                {item.next_maintenance_at
                  ? format(new Date(item.next_maintenance_at), 'PPP', { locale: dateLocale })
                  : t('maintenance.notScheduled')}
              </p>
            </div>
          </div>
          {item.maintenance_interval_days && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('maintenance.interval')}
              </p>
              <p className="text-lg">
                {t('maintenance.everyDays', { days: item.maintenance_interval_days })}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={() => setLogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('maintenance.logMaintenance')}
            </Button>
            <Button variant="outline" onClick={() => setScheduleOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              {t('maintenance.setSchedule')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            {t('maintenance.history')}
          </CardTitle>
          <CardDescription>
            {t('maintenance.historyDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {t('maintenance.noHistory')}
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-3 rounded-lg border"
                >
                  <div className="p-2 rounded-full bg-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {format(new Date(log.performed_at), 'PPP', { locale: dateLocale })}
                    </p>
                    {log.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {log.notes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('maintenance.logged')}: {format(new Date(log.created_at), 'PPp', { locale: dateLocale })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <LogMaintenanceForm
        open={logOpen}
        onOpenChange={setLogOpen}
        itemId={item.id}
      />
      <ScheduleForm
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        item={item}
      />
    </div>
  )
}

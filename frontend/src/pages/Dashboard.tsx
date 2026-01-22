import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle, Clock, Package } from 'lucide-react'
import { format, isPast, isFuture, addDays } from 'date-fns'
import { fi, enUS } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useItems, useItemsDue } from '@/api/items'
import type { Item } from '@/api/types'

function getMaintenanceStatus(item: Item): 'overdue' | 'due-soon' | 'ok' | 'unscheduled' {
  if (!item.next_maintenance_at) return 'unscheduled'
  const nextDate = new Date(item.next_maintenance_at)
  if (isPast(nextDate)) return 'overdue'
  if (isFuture(nextDate) && nextDate <= addDays(new Date(), 7)) return 'due-soon'
  return 'ok'
}

function StatusBadge({ status }: { status: ReturnType<typeof getMaintenanceStatus> }) {
  const { t } = useTranslation()

  switch (status) {
    case 'overdue':
      return <Badge variant="destructive">{t('maintenance.badge.overdue')}</Badge>
    case 'due-soon':
      return <Badge variant="warning">{t('maintenance.badge.dueSoon')}</Badge>
    case 'ok':
      return <Badge variant="success">{t('maintenance.badge.ok')}</Badge>
    case 'unscheduled':
      return <Badge variant="secondary">{t('maintenance.badge.noSchedule')}</Badge>
  }
}

export function Dashboard() {
  const { t, i18n } = useTranslation()
  const { data: items = [], isLoading: itemsLoading } = useItems()
  const { data: dueItems = [], isLoading: dueLoading } = useItemsDue()

  const isLoading = itemsLoading || dueLoading
  const dateLocale = i18n.language === 'fi' ? fi : enUS

  // Calculate stats
  const totalItems = items.length
  const overdueItems = dueItems.filter(
    (item) => item.next_maintenance_at && isPast(new Date(item.next_maintenance_at))
  )
  const dueSoonItems = dueItems.filter((item) => {
    if (!item.next_maintenance_at) return false
    const nextDate = new Date(item.next_maintenance_at)
    return isFuture(nextDate) && nextDate <= addDays(new Date(), 7)
  })

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalItems')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.itemsTracked')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.dueSoon')}</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dueSoonItems.length}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.withinDays')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.overdue')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueItems.length}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.needsAttention')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Items */}
      {overdueItems.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t('dashboard.overdueTitle')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.overdueDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('dashboard.due')}: {item.next_maintenance_at && format(new Date(item.next_maintenance_at), 'PPP', { locale: dateLocale })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status="overdue" />
                    <Button asChild size="sm">
                      <Link to={`/items/${item.id}`}>{t('common.view')}</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Due Soon Items */}
      {dueSoonItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              {t('dashboard.upcomingTitle')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.upcomingDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dueSoonItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('dashboard.due')}: {item.next_maintenance_at && format(new Date(item.next_maintenance_at), 'PPP', { locale: dateLocale })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status="due-soon" />
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/items/${item.id}`}>{t('common.view')}</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Good State */}
      {overdueItems.length === 0 && dueSoonItems.length === 0 && totalItems > 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <CheckCircle className="h-12 w-12 text-success mb-4" />
            <h3 className="text-lg font-semibold">{t('dashboard.allCaughtUp')}</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              {t('dashboard.allCaughtUpDescription')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {totalItems === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">{t('dashboard.noItemsYet')}</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              {t('dashboard.noItemsDescription')}
            </p>
            <Button asChild>
              <Link to="/items">{t('dashboard.addItem')}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

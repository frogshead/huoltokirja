import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { useUpdateItemSchedule } from '@/api/items'
import type { Item } from '@/api/types'

interface ScheduleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Item
}

export function ScheduleForm({ open, onOpenChange, item }: ScheduleFormProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const updateSchedule = useUpdateItemSchedule(item.id)

  const [nextDate, setNextDate] = useState(
    item.next_maintenance_at
      ? format(new Date(item.next_maintenance_at), 'yyyy-MM-dd')
      : ''
  )
  const [intervalDays, setIntervalDays] = useState(
    item.maintenance_interval_days?.toString() ?? ''
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateSchedule.mutateAsync({
        next_maintenance_at: nextDate ? new Date(nextDate).toISOString() : null,
        maintenance_interval_days: intervalDays ? parseInt(intervalDays, 10) : null,
      })
      toast({ title: t('maintenance.scheduleUpdated') })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.error'),
        variant: 'destructive',
      })
    }
  }

  const handleClearSchedule = async () => {
    try {
      await updateSchedule.mutateAsync({
        next_maintenance_at: null,
        maintenance_interval_days: null,
      })
      toast({ title: t('maintenance.scheduleCleared') })
      setNextDate('')
      setIntervalDays('')
      onOpenChange(false)
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.error'),
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('maintenance.scheduleForm.title')}</DialogTitle>
            <DialogDescription>
              {t('maintenance.scheduleForm.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nextDate">{t('maintenance.scheduleForm.nextDate')}</Label>
              <Input
                id="nextDate"
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                disabled={updateSchedule.isPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="interval">{t('maintenance.scheduleForm.intervalDays')}</Label>
              <Input
                id="interval"
                type="number"
                min="1"
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
                placeholder={t('maintenance.scheduleForm.intervalPlaceholder')}
                disabled={updateSchedule.isPending}
              />
              <p className="text-xs text-muted-foreground">
                {t('maintenance.scheduleForm.intervalHelp')}
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {(item.next_maintenance_at || item.maintenance_interval_days) && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearSchedule}
                disabled={updateSchedule.isPending}
                className="sm:mr-auto"
              >
                {t('maintenance.scheduleForm.clearSchedule')}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateSchedule.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={updateSchedule.isPending}>
              {updateSchedule.isPending ? t('common.saving') : t('maintenance.scheduleForm.saveSchedule')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

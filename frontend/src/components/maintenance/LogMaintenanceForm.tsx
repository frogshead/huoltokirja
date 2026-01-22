import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { useLogMaintenance } from '@/api/maintenance'

interface LogMaintenanceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: string
}

export function LogMaintenanceForm({
  open,
  onOpenChange,
  itemId,
}: LogMaintenanceFormProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const logMaintenance = useLogMaintenance(itemId)

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!date) {
      toast({
        title: t('common.error'),
        description: t('common.required'),
        variant: 'destructive',
      })
      return
    }

    try {
      await logMaintenance.mutateAsync({
        performed_at: new Date(date).toISOString(),
        notes: notes.trim() || null,
      })
      toast({ title: t('maintenance.maintenanceLogged') })
      onOpenChange(false)
      // Reset form
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setNotes('')
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
            <DialogTitle>{t('maintenance.logForm.title')}</DialogTitle>
            <DialogDescription>
              {t('maintenance.logForm.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">{t('maintenance.logForm.datePerformed')}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={logMaintenance.isPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">{t('maintenance.logForm.notes')} ({t('common.optional')})</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('maintenance.logForm.notesPlaceholder')}
                disabled={logMaintenance.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={logMaintenance.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={logMaintenance.isPending}>
              {logMaintenance.isPending ? t('common.saving') : t('maintenance.logMaintenance')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

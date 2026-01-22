import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { useCreateItem, useCreateChildItem, useUpdateItem } from '@/api/items'
import type { Item, ItemCreate, ItemUpdate } from '@/api/types'

interface ItemFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: Item
  parentId?: string
  onSuccess?: () => void
}

export function ItemForm({ open, onOpenChange, item, parentId, onSuccess }: ItemFormProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const isEditing = !!item
  const isChild = !!parentId

  const [name, setName] = useState(item?.name ?? '')
  const [description, setDescription] = useState(item?.description ?? '')

  const createItem = useCreateItem()
  const createChildItem = useCreateChildItem(parentId ?? '')
  const updateItem = useUpdateItem(item?.id ?? '')

  const isLoading = createItem.isPending || createChildItem.isPending || updateItem.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: t('common.error'),
        description: t('items.form.nameRequired'),
        variant: 'destructive',
      })
      return
    }

    try {
      if (isEditing) {
        const data: ItemUpdate = {
          name: name.trim(),
          description: description.trim() || null,
        }
        await updateItem.mutateAsync(data)
        toast({ title: t('items.itemUpdated') })
      } else {
        const data: ItemCreate = {
          name: name.trim(),
          description: description.trim() || null,
        }
        if (isChild) {
          await createChildItem.mutateAsync(data)
          toast({ title: t('items.childItemCreated') })
        } else {
          await createItem.mutateAsync(data)
          toast({ title: t('items.itemCreated') })
        }
      }
      onOpenChange(false)
      onSuccess?.()
      // Reset form
      setName('')
      setDescription('')
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.error'),
        variant: 'destructive',
      })
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setName(item?.name ?? '')
      setDescription(item?.description ?? '')
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? t('items.form.titleEdit') : isChild ? t('items.form.titleChild') : t('items.form.title')}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? t('items.form.descriptionEdit')
                : isChild
                  ? t('items.form.descriptionChild')
                  : t('items.form.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('items.form.name')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('items.form.namePlaceholder')}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{t('items.form.itemDescription')} ({t('common.optional')})</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('items.form.descriptionPlaceholder')}
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('common.saving') : isEditing ? t('common.save') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

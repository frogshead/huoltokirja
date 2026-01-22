import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { fi, enUS } from 'date-fns/locale'
import {
  Edit,
  FileText,
  MessageSquare,
  MoreVertical,
  Plus,
  Trash2,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { useItem, useDeleteItem } from '@/api/items'
import { ItemForm } from './ItemForm'
import { MaintenanceSection } from '@/components/maintenance/MaintenanceSection'
import { DocumentsSection } from '@/components/documents/DocumentsSection'
import { CommentsSection } from '@/components/comments/CommentsSection'

interface ItemDetailProps {
  itemId: string
  onAddChild: () => void
}

export function ItemDetail({ itemId, onAddChild }: ItemDetailProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: item, isLoading, error } = useItem(itemId)
  const deleteItem = useDeleteItem(itemId)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const dateLocale = i18n.language === 'fi' ? fi : enUS

  const handleDelete = async () => {
    try {
      await deleteItem.mutateAsync()
      toast({ title: t('items.itemDeleted') })
      navigate('/items')
    } catch (err) {
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : t('common.error'),
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-full bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">
          {t('common.error')}
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{item.name}</h1>
          {item.description && (
            <p className="text-muted-foreground mt-1">{item.description}</p>
          )}
          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
            <span>{t('items.created')}: {format(new Date(item.created_at), 'PP', { locale: dateLocale })}</span>
            <span>{t('items.updated')}: {format(new Date(item.updated_at), 'PP', { locale: dateLocale })}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onAddChild}>
            <Plus className="h-4 w-4 mr-1" />
            {t('items.addChild')}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Children */}
      {item.children && item.children.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t('items.childItems')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {item.children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => navigate(`/items/${child.id}`)}
                  className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <p className="font-medium">{child.name}</p>
                  {child.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {child.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="maintenance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="maintenance" className="gap-2">
            <Wrench className="h-4 w-4" />
            {t('maintenance.title')}
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            {t('documents.title')}
          </TabsTrigger>
          <TabsTrigger value="comments" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            {t('comments.title')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance">
          <MaintenanceSection item={item} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsSection itemId={itemId} />
        </TabsContent>

        <TabsContent value="comments">
          <CommentsSection itemId={itemId} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <ItemForm
        open={editOpen}
        onOpenChange={setEditOpen}
        item={item}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('items.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('items.deleteConfirmDescription', { name: item.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

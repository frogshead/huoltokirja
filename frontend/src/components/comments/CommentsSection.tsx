import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { fi, enUS } from 'date-fns/locale'
import { Edit, MessageSquare, Send, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
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
import {
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from '@/api/comments'
import type { Comment } from '@/api/types'

interface CommentsSectionProps {
  itemId: string
}

export function CommentsSection({ itemId }: CommentsSectionProps) {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  const { data: comments = [], isLoading } = useComments(itemId)
  const createComment = useCreateComment(itemId)
  const updateComment = useUpdateComment(itemId)
  const deleteComment = useDeleteComment(itemId)

  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const dateLocale = i18n.language === 'fi' ? fi : enUS

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      await createComment.mutateAsync({ content: newComment.trim() })
      setNewComment('')
      toast({ title: t('comments.commentAdded') })
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.error'),
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return

    try {
      await updateComment.mutateAsync({
        commentId: editingId,
        data: { content: editContent.trim() },
      })
      setEditingId(null)
      setEditContent('')
      toast({ title: t('comments.commentUpdated') })
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.error'),
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteComment.mutateAsync(deleteId)
      setDeleteId(null)
      toast({ title: t('comments.commentDeleted') })
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.error'),
        variant: 'destructive',
      })
    }
  }

  const deleteCommentContent = comments.find((c) => c.id === deleteId)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {t('comments.title')}
        </CardTitle>
        <CardDescription>{t('comments.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Comment Form */}
        <form onSubmit={handleCreate} className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('comments.addPlaceholder')}
            className="min-h-[80px]"
          />
          <Button
            type="submit"
            size="icon"
            className="shrink-0"
            disabled={!newComment.trim() || createComment.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {/* Comments List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            {t('comments.noComments')}
          </p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-3 rounded-lg border"
              >
                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4 mr-1" />
                        {t('common.cancel')}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={!editContent.trim() || updateComment.isPending}
                      >
                        {t('common.save')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap">{comment.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), 'PPp', { locale: dateLocale })}
                        {comment.updated_at !== comment.created_at && ` (${t('comments.edited')})`}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(comment)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setDeleteId(comment.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('comments.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('comments.deleteConfirmDescription')}
              {deleteCommentContent && (
                <span className="block mt-2 p-2 bg-muted rounded text-sm">
                  "{deleteCommentContent.content.slice(0, 100)}
                  {deleteCommentContent.content.length > 100 && '...'}"
                </span>
              )}
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
    </Card>
  )
}

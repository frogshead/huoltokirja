import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDropzone } from 'react-dropzone'
import { format } from 'date-fns'
import { fi, enUS } from 'date-fns/locale'
import { Download, File, FileText, Image, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useDocuments, useUploadDocument, useDeleteDocument } from '@/api/documents'
import { getDownloadUrl } from '@/api/client'
import type { Document } from '@/api/types'

interface DocumentsSectionProps {
  itemId: string
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType: string | null) {
  if (mimeType?.startsWith('image/')) {
    return <Image className="h-8 w-8 text-blue-500" />
  }
  if (mimeType?.includes('pdf')) {
    return <FileText className="h-8 w-8 text-red-500" />
  }
  return <File className="h-8 w-8 text-muted-foreground" />
}

export function DocumentsSection({ itemId }: DocumentsSectionProps) {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  const { data: documents = [], isLoading } = useDocuments(itemId)
  const uploadDocument = useUploadDocument(itemId)
  const deleteDocument = useDeleteDocument(itemId)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState('')

  const dateLocale = i18n.language === 'fi' ? fi : enUS

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  })

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      await uploadDocument.mutateAsync({
        file: selectedFile,
        documentType: documentType.trim() || undefined,
      })
      toast({ title: t('documents.documentUploaded') })
      setUploadOpen(false)
      setSelectedFile(null)
      setDocumentType('')
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.error'),
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteDoc) return

    try {
      await deleteDocument.mutateAsync(deleteDoc.id)
      toast({ title: t('documents.documentDeleted') })
      setDeleteDoc(null)
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.error'),
        variant: 'destructive',
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('documents.title')}
            </CardTitle>
            <CardDescription>
              {t('documents.description')}
            </CardDescription>
          </div>
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            {t('documents.upload')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            {t('documents.noDocuments')}
          </p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-3 rounded-lg border"
              >
                {getFileIcon(doc.mime_type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{doc.original_filename}</p>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <span>{formatFileSize(doc.file_size_bytes)}</span>
                    {doc.document_type && (
                      <>
                        <span>•</span>
                        <span>{doc.document_type}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{format(new Date(doc.uploaded_at), 'PP', { locale: dateLocale })}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <a href={getDownloadUrl(doc.id)} download>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteDoc(doc)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('documents.uploadForm.title')}</DialogTitle>
            <DialogDescription>
              {t('documents.uploadForm.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              {selectedFile ? (
                <div className="space-y-2">
                  <File className="h-10 w-10 mx-auto text-primary" />
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('documents.uploadForm.dropzoneReplace')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p>{t('documents.uploadForm.dropzone')}</p>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="documentType">{t('documents.uploadForm.documentType')} ({t('common.optional')})</Label>
              <Input
                id="documentType"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                placeholder={t('documents.uploadForm.documentTypePlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadOpen(false)
                setSelectedFile(null)
                setDocumentType('')
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadDocument.isPending}
            >
              {uploadDocument.isPending ? t('common.uploading') : t('common.upload')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDoc} onOpenChange={(open) => !open && setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('documents.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('documents.deleteConfirmDescription', { name: deleteDoc?.original_filename })}
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

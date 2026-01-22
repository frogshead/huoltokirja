import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiDelete, apiUpload } from './client'
import type { Document } from './types'

// Query keys
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (itemId: string) => [...documentKeys.lists(), itemId] as const,
}

// Queries
export function useDocuments(itemId: string | undefined) {
  return useQuery({
    queryKey: documentKeys.list(itemId!),
    queryFn: () => apiGet<Document[]>(`/items/${itemId}/documents`),
    enabled: !!itemId,
  })
}

// Mutations
export function useUploadDocument(itemId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, documentType }: { file: File; documentType?: string }) =>
      apiUpload<Document>(`/items/${itemId}/documents`, file, documentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.list(itemId) })
    },
  })
}

export function useDeleteDocument(itemId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (documentId: string) => apiDelete(`/documents/${documentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.list(itemId) })
    },
  })
}

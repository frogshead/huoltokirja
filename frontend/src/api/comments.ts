import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut, apiDelete } from './client'
import type { Comment, CommentCreate, CommentUpdate } from './types'

// Query keys
export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (itemId: string) => [...commentKeys.lists(), itemId] as const,
}

// Queries
export function useComments(itemId: string | undefined) {
  return useQuery({
    queryKey: commentKeys.list(itemId!),
    queryFn: () => apiGet<Comment[]>(`/items/${itemId}/comments`),
    enabled: !!itemId,
  })
}

// Mutations
export function useCreateComment(itemId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CommentCreate) =>
      apiPost<Comment>(`/items/${itemId}/comments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(itemId) })
    },
  })
}

export function useUpdateComment(itemId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: CommentUpdate }) =>
      apiPut<Comment>(`/comments/${commentId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(itemId) })
    },
  })
}

export function useDeleteComment(itemId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commentId: string) => apiDelete(`/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(itemId) })
    },
  })
}

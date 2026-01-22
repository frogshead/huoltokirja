import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut, apiDelete } from './client'
import type {
  Item,
  ItemWithChildren,
  ItemCreate,
  ItemUpdate,
  ItemScheduleUpdate,
} from './types'

// Query keys
export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: () => [...itemKeys.lists()] as const,
  due: () => [...itemKeys.all, 'due'] as const,
  details: () => [...itemKeys.all, 'detail'] as const,
  detail: (id: string) => [...itemKeys.details(), id] as const,
}

// Queries
export function useItems() {
  return useQuery({
    queryKey: itemKeys.list(),
    queryFn: () => apiGet<Item[]>('/items'),
  })
}

export function useItem(id: string | undefined) {
  return useQuery({
    queryKey: itemKeys.detail(id!),
    queryFn: () => apiGet<ItemWithChildren>(`/items/${id}`),
    enabled: !!id,
  })
}

export function useItemsDue() {
  return useQuery({
    queryKey: itemKeys.due(),
    queryFn: () => apiGet<Item[]>('/items/due'),
  })
}

// Mutations
export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ItemCreate) => apiPost<Item>('/items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() })
    },
  })
}

export function useCreateChildItem(parentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ItemCreate) =>
      apiPost<Item>(`/items/${parentId}/children`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() })
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(parentId) })
    },
  })
}

export function useUpdateItem(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ItemUpdate) => apiPut<Item>(`/items/${id}`, data),
    onSuccess: (updatedItem) => {
      queryClient.setQueryData(itemKeys.detail(id), (old: ItemWithChildren | undefined) =>
        old ? { ...old, ...updatedItem } : old
      )
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() })
    },
  })
}

export function useUpdateItemSchedule(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ItemScheduleUpdate) =>
      apiPut<Item>(`/items/${id}/schedule`, data),
    onSuccess: (updatedItem) => {
      queryClient.setQueryData(itemKeys.detail(id), (old: ItemWithChildren | undefined) =>
        old ? { ...old, ...updatedItem } : old
      )
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() })
      queryClient.invalidateQueries({ queryKey: itemKeys.due() })
    },
  })
}

export function useDeleteItem(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiDelete(`/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() })
      queryClient.removeQueries({ queryKey: itemKeys.detail(id) })
    },
  })
}

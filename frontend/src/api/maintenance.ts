import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from './client'
import type { MaintenanceLog, MaintenanceLogCreate } from './types'
import { itemKeys } from './items'

// Query keys
export const maintenanceKeys = {
  all: ['maintenance'] as const,
  lists: () => [...maintenanceKeys.all, 'list'] as const,
  list: (itemId: string) => [...maintenanceKeys.lists(), itemId] as const,
}

// Queries
export function useMaintenanceHistory(itemId: string | undefined) {
  return useQuery({
    queryKey: maintenanceKeys.list(itemId!),
    queryFn: () => apiGet<MaintenanceLog[]>(`/items/${itemId}/maintenance`),
    enabled: !!itemId,
  })
}

// Mutations
export function useLogMaintenance(itemId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MaintenanceLogCreate) =>
      apiPost<MaintenanceLog>(`/items/${itemId}/maintenance`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.list(itemId) })
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(itemId) })
      queryClient.invalidateQueries({ queryKey: itemKeys.due() })
    },
  })
}

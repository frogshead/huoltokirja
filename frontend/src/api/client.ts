import type { ApiError } from './types'

const API_BASE = '/api/v1'

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail: string | undefined
    try {
      const error: ApiError = await response.json()
      detail = error.detail
    } catch {
      // Response is not JSON
    }
    throw new ApiClientError(
      detail || `HTTP error ${response.status}`,
      response.status,
      detail
    )
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return handleResponse<T>(response)
}

export async function apiPost<T, D = unknown>(path: string, data?: D): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  })
  return handleResponse<T>(response)
}

export async function apiPut<T, D = unknown>(path: string, data?: D): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  })
  return handleResponse<T>(response)
}

export async function apiDelete<T = void>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return handleResponse<T>(response)
}

export async function apiUpload<T>(
  path: string,
  file: File,
  documentType?: string
): Promise<T> {
  const formData = new FormData()
  formData.append('file', file)
  if (documentType) {
    formData.append('document_type', documentType)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: formData,
  })
  return handleResponse<T>(response)
}

export function getDownloadUrl(documentId: string): string {
  return `${API_BASE}/documents/${documentId}/download`
}

// Item types
export interface Item {
  id: string
  name: string
  description: string | null
  parent_id: string | null
  last_maintenance_at: string | null
  next_maintenance_at: string | null
  maintenance_interval_days: number | null
  created_at: string
  updated_at: string
}

export interface ItemWithChildren extends Item {
  children: Item[]
}

export interface ItemCreate {
  name: string
  description?: string | null
}

export interface ItemUpdate {
  name?: string | null
  description?: string | null
}

export interface ItemScheduleUpdate {
  next_maintenance_at?: string | null
  maintenance_interval_days?: number | null
}

// Document types
export interface Document {
  id: string
  item_id: string
  filename: string
  original_filename: string
  mime_type: string | null
  file_size_bytes: number | null
  document_type: string | null
  uploaded_at: string
}

export interface DocumentCreate {
  document_type?: string | null
}

// Comment types
export interface Comment {
  id: string
  item_id: string
  content: string
  created_at: string
  updated_at: string
}

export interface CommentCreate {
  content: string
}

export interface CommentUpdate {
  content: string
}

// MaintenanceLog types
export interface MaintenanceLog {
  id: string
  item_id: string
  performed_at: string
  notes: string | null
  created_at: string
}

export interface MaintenanceLogCreate {
  performed_at: string
  notes?: string | null
}

// API Error type
export interface ApiError {
  detail: string
}

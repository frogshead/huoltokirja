import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, ChevronDown, Package, Plus } from 'lucide-react'
import { isPast, addDays, isFuture } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useItems, useItem } from '@/api/items'
import type { Item } from '@/api/types'

interface ItemTreeNodeProps {
  item: Item
  level: number
  selectedId?: string
  expandedIds: Set<string>
  onToggle: (id: string) => void
  childrenMap: Map<string, Item[]>
}

function getStatusColor(item: Item): string {
  if (!item.next_maintenance_at) return 'bg-gray-400'
  const nextDate = new Date(item.next_maintenance_at)
  if (isPast(nextDate)) return 'bg-destructive'
  if (isFuture(nextDate) && nextDate <= addDays(new Date(), 7)) return 'bg-warning'
  return 'bg-success'
}

function ItemTreeNode({
  item,
  level,
  selectedId,
  expandedIds,
  onToggle,
  childrenMap,
}: ItemTreeNodeProps) {
  const children = childrenMap.get(item.id) || []
  const hasChildren = children.length > 0
  const isExpanded = expandedIds.has(item.id)
  const isSelected = selectedId === item.id

  return (
    <div>
      <Link
        to={`/items/${item.id}`}
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors',
          isSelected && 'bg-accent'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.preventDefault()
              onToggle(item.id)
            }}
            className="p-0.5 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <span
          className={cn('w-2 h-2 rounded-full', getStatusColor(item))}
          title={
            item.next_maintenance_at
              ? `Next: ${new Date(item.next_maintenance_at).toLocaleDateString()}`
              : 'No schedule'
          }
        />
        <Package className="h-4 w-4 text-muted-foreground" />
        <span className="truncate">{item.name}</span>
      </Link>
      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => (
            <ItemTreeNode
              key={child.id}
              item={child}
              level={level + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              childrenMap={childrenMap}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface ItemTreeProps {
  onAddItem: () => void
}

export function ItemTree({ onAddItem }: ItemTreeProps) {
  const { t } = useTranslation()
  const { itemId } = useParams<{ itemId: string }>()
  const { data: items = [], isLoading } = useItems()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Also fetch the selected item to get its children
  const { data: selectedItem } = useItem(itemId)

  // Build a map of parent -> children for tree rendering
  // We need to fetch children recursively, but for now we'll use a simpler approach
  // where we show root items and expand to show their direct children
  const childrenMap = new Map<string, Item[]>()

  // Add children from the selected item if available
  if (selectedItem?.children) {
    childrenMap.set(selectedItem.id, selectedItem.children)
  }

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Auto-expand parent of selected item
  // This would need the parent info which we'll handle later

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 bg-muted rounded animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <Button onClick={onAddItem} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('items.addItem')}
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('items.noItems')}
          </p>
        ) : (
          items.map((item) => (
            <ItemTreeNode
              key={item.id}
              item={item}
              level={0}
              selectedId={itemId}
              expandedIds={expandedIds}
              onToggle={handleToggle}
              childrenMap={childrenMap}
            />
          ))
        )}
      </div>
    </div>
  )
}

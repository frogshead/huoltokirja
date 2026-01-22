import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Package } from 'lucide-react'
import { ItemTree } from '@/components/items/ItemTree'
import { ItemDetail } from '@/components/items/ItemDetail'
import { ItemForm } from '@/components/items/ItemForm'

export function ItemsPage() {
  const { t } = useTranslation()
  const { itemId } = useParams<{ itemId: string }>()
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [addChildOpen, setAddChildOpen] = useState(false)

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left Panel - Item Tree */}
      <div className="w-72 border-r bg-muted/30 flex-shrink-0">
        <ItemTree onAddItem={() => setAddItemOpen(true)} />
      </div>

      {/* Right Panel - Item Detail */}
      <div className="flex-1 overflow-auto">
        {itemId ? (
          <ItemDetail
            itemId={itemId}
            onAddChild={() => setAddChildOpen(true)}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Package className="h-16 w-16 mb-4" />
            <h2 className="text-xl font-semibold">{t('items.selectItem')}</h2>
            <p className="mt-2">
              {t('items.selectItemDescription')}
            </p>
          </div>
        )}
      </div>

      {/* Add Root Item Dialog */}
      <ItemForm
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
      />

      {/* Add Child Item Dialog */}
      {itemId && (
        <ItemForm
          open={addChildOpen}
          onOpenChange={setAddChildOpen}
          parentId={itemId}
        />
      )}
    </div>
  )
}

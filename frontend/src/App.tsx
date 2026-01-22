import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { ItemsPage } from '@/pages/ItemsPage'
import { Toaster } from '@/components/ui/toaster'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="items" element={<ItemsPage />} />
          <Route path="items/:itemId" element={<ItemsPage />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}

export default App

import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Items } from './pages/Items'
import { Customers } from './pages/Customers'
import { Suppliers } from './pages/Suppliers'
import { Invoices } from './pages/Invoices'
import { CreateInvoice } from './pages/CreateInvoice'
import { Auth } from './pages/Auth'

import { Toaster } from '@/components/ui/sonner'

import { Dashboard } from './pages/Dashboard'

function App() {
  const token = localStorage.getItem('token');

  if (!token) {
    return (
      <>
        <Auth />
        <Toaster position="bottom-center" richColors />
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="items" element={<Items />} />
          <Route path="customers" element={<Customers />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/new" element={<CreateInvoice />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster position="bottom-center" richColors />
    </>
  )
}

export default App

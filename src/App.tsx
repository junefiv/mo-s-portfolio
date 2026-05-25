import { useEffect, useLayoutEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import Navigation from './components/Navigation'
import News from './pages/News'
import AdminPage from './pages/admin/AdminPage'
import Info from './pages/Info'
import Work from './pages/Work'
import {applySiteDocumentMeta} from '@/lib/siteDocumentMeta'

export default function App() {
  const location = useLocation()
  const isAdmin =
    location.pathname === '/admin' ||
    location.pathname.startsWith('/admin/')

  useLayoutEffect(() => {
    applySiteDocumentMeta(location.pathname)
  }, [location.pathname])

  useEffect(() => {
    if (isAdmin) return

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }
    const onDragStart = (e: DragEvent) => {
      if (e.target instanceof HTMLImageElement) {
        e.preventDefault()
      }
    }

    document.addEventListener('contextmenu', onContextMenu, true)
    document.addEventListener('dragstart', onDragStart, true)
    return () => {
      document.removeEventListener('contextmenu', onContextMenu, true)
      document.removeEventListener('dragstart', onDragStart, true)
    }
  }, [isAdmin])

  return (
    <div
      className={`mx-auto min-h-screen w-full min-w-0 max-w-page ${
        isAdmin ? '' : 'site-content-guard'
      }`}
    >
      <Navigation />
      <div className="min-w-0">
        <Routes>
          <Route path="/" element={<Work />} />
          <Route path="/work" element={<Navigate to="/" replace />} />
          <Route path="/news" element={<News />} />
          <Route path="/fabrication" element={<Navigate to="/" replace />} />
          <Route path="/info" element={<Info />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </div>
  )
}

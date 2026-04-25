import { useLayoutEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import Navigation from './components/Navigation'
import Fabrication from './pages/Fabrication'
import News from './pages/News'
import AdminPage from './pages/admin/AdminPage'
import Info from './pages/Info'
import Work from './pages/Work'
import { SITE_TITLE } from './siteMeta'

export default function App() {
  useLayoutEffect(() => {
    document.title = SITE_TITLE
  }, [])

  return (
    <div className="mx-auto min-h-screen w-full min-w-0 max-w-page">
      <Navigation />
      <Routes>
        <Route path="/" element={<Work />} />
        <Route path="/work" element={<Navigate to="/" replace />} />
        <Route path="/news" element={<News />} />
        <Route path="/fabrication" element={<Fabrication />} />
        <Route path="/info" element={<Info />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </div>
  )
}

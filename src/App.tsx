import { Route, Routes } from 'react-router'
import Navigation from './components/Navigation'
import Academics from './pages/Academics'
import Fabrication from './pages/Fabrication'
import Fakt from './pages/Fakt'
import Info from './pages/Info'
import Work from './pages/Work'

export default function App() {
  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<Fakt />} />
        <Route path="/academics" element={<Academics />} />
        <Route path="/work" element={<Work />} />
        <Route path="/fabrication" element={<Fabrication />} />
        <Route path="/info" element={<Info />} />
      </Routes>
    </>
  )
}

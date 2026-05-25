import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import faviconUrl from './assets/logo.png'
import './index.css'
import App from './App.tsx'

{
  const link =
    document.querySelector<HTMLLinkElement>("link[rel='icon']") ??
    (() => {
      const el = document.createElement('link')
      el.rel = 'icon'
      document.head.appendChild(el)
      return el
    })()
  link.type = 'image/png'
  link.href = faviconUrl
}

const baseUrl = import.meta.env.BASE_URL
const routerBasename =
  baseUrl === '/' ? undefined : baseUrl.replace(/\/$/, '')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

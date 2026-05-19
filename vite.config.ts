import { copyFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { adminApiPlugin } from './vite/adminApiPlugin'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** 배포: https://studiodecho.com/ (GitHub Pages 커스텀 도메인, site root `/`) */
const SITE_BASE = '/'

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'

  return {
    base: SITE_BASE,
    resolve: {
      alias: {
        '@': join(__dirname, 'src'),
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      adminApiPlugin(),
      {
        name: 'gh-pages-404',
        closeBundle() {
          if (!isProd) return
          const dist = join(__dirname, 'dist')
          const indexHtml = join(dist, 'index.html')
          if (existsSync(indexHtml)) {
            copyFileSync(indexHtml, join(dist, '404.html'))
          }
        },
      },
    ],
  }
})

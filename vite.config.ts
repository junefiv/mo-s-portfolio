import { copyFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { adminApiPlugin } from './vite/adminApiPlugin'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * GitHub Project Pages URL: `https://<user>.github.io/<저장소이름>/`
 * `vite build`는 기본이 `/`이면 배포 루트와 맞지 않아 JS를 못 불러 흰 화면만 납니다.
 * 저장소 이름이 다르면 `GITHUB_PAGES_REPO`만 맞추면 됩니다.
 */
const GITHUB_PAGES_REPO = 'mo-s-portfolio'

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'
  const slug = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? GITHUB_PAGES_REPO
  const base = isProd ? `/${slug}/` : '/'

  return {
    base,
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
          if (base === '/') return
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

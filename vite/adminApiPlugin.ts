import type {IncomingMessage, ServerResponse} from 'node:http'
import {loadEnv, type Plugin} from 'vite'
import {parsePortfolioAdminEnv, PortfolioAdminApi, type AdminEnvLoad} from '../server/portfolioAdminHandler'

export function adminApiPlugin(): Plugin {
  let adminLoad: AdminEnvLoad | null = null
  let baseStrip = ''
  let api: PortfolioAdminApi | null = null

  return {
    name: 'portfolio-admin-api',
    configResolved(config) {
      const env = loadEnv(config.mode, config.root, '')
      adminLoad = parsePortfolioAdminEnv(env, {
        devFallbackSecret: config.mode === 'development',
      })
      api = new PortfolioAdminApi(() =>
        adminLoad ?? {status: 'disabled', message: 'Vite 설정이 아직 로드되지 않았습니다.'},
      )
      const b = config.base ?? '/'
      baseStrip = b.replace(/\/$/, '')
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next()

        const rawPath = req.url.split('?')[0] ?? ''
        let pathname = rawPath
        if (baseStrip && rawPath.startsWith(baseStrip)) {
          pathname = rawPath.slice(baseStrip.length) || '/'
        }
        if (!pathname.startsWith('/api/admin')) return next()

        const r = req as IncomingMessage
        const s = res as ServerResponse
        await api!.handle(r, s, pathname)
      })
    },
  }
}

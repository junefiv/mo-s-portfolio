/**
 * Vercel Serverless — GitHub Pages 프론트의 `VITE_ADMIN_API_ORIGIN` 이 가리키는 백엔드.
 * @see docs/VERCEL_ADMIN_API.md
 */
import type {VercelRequest, VercelResponse} from '@vercel/node'
import {parsePortfolioAdminEnv, PortfolioAdminApi} from '../../server/portfolioAdminHandler'

const api = new PortfolioAdminApi(() =>
  parsePortfolioAdminEnv(process.env as Record<string, string | undefined>, {
    devFallbackSecret: false,
  }),
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const segments = req.query.path
  const joined = Array.isArray(segments) ? segments.join('/') : (segments ?? '')
  const pathname = '/api/admin/' + joined.replace(/^\/+/, '')

  await api.handle(req, res, pathname)
}

export const config = {
  api: {
    bodyParser: false,
  },
}

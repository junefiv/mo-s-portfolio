/**
 * Vercel Serverless — 단일 경로 세그먼트(`[path]`)로 라우팅.
 * @see docs/VERCEL_ADMIN_API.md
 */
import type {VercelRequest, VercelResponse} from '@vercel/node'
import {
  attachAdminApiCorsHeaders,
  parsePortfolioAdminEnv,
  PortfolioAdminApi,
} from '../lib/portfolioAdminHandler'

let api: PortfolioAdminApi | null = null
function getApi(): PortfolioAdminApi {
  if (!api) {
    api = new PortfolioAdminApi(() =>
      parsePortfolioAdminEnv(process.env as Record<string, string | undefined>, {
        devFallbackSecret: false,
      }),
    )
  }
  return api
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    attachAdminApiCorsHeaders(res)
    res.setHeader('Access-Control-Max-Age', '86400')
    res.statusCode = 200
    res.end()
    return
  }

  const seg = req.query.path
  const one = Array.isArray(seg) ? (seg[0] ?? '') : typeof seg === 'string' ? seg : ''
  const pathname = '/api/admin/' + String(one).replace(/^\/+/, '')

  await getApi().handle(req, res, pathname)
}

export const config = {
  api: {
    bodyParser: false,
  },
}

/**
 * Vercel Serverless — 단일 경로 세그먼트(`[path]`)로 OPTIONS 프리플라이트가 안정적으로 라우팅되게 함.
 * @see docs/VERCEL_ADMIN_API.md
 */
import type {VercelRequest, VercelResponse} from '@vercel/node'
import {
  attachAdminApiCorsHeaders,
  parsePortfolioAdminEnv,
  PortfolioAdminApi,
} from '../../server/portfolioAdminHandler'

const api = new PortfolioAdminApi(() =>
  parsePortfolioAdminEnv(process.env as Record<string, string | undefined>, {
    devFallbackSecret: false,
  }),
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel이 OPTIONS를 함수 밖에서 처리하거나 catch-all과 꼬일 때 대비: 가장 먼저 응답
  if (req.method === 'OPTIONS') {
    attachAdminApiCorsHeaders(res)
    res.setHeader('Access-Control-Max-Age', '86400')
    res.statusCode = 204
    res.end()
    return
  }

  const seg = req.query.path
  const one = Array.isArray(seg) ? (seg[0] ?? '') : typeof seg === 'string' ? seg : ''
  const pathname = '/api/admin/' + String(one).replace(/^\/+/, '')

  await api.handle(req, res, pathname)
}

export const config = {
  api: {
    bodyParser: false,
  },
}

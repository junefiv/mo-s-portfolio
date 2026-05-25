/** 브라우저 탭·OG·로고 문구 */
export const SITE_TITLE = 'Studio DeCho'

/** 프로덕션 도메인 (GitHub Pages `public/CNAME` 와 맞출 것) */
export const SITE_URL = 'https://studiodecho.com'

/** `public/og.png` — SNS 미리보기용 (소스: `src/assets/logo.png`) */
export const SITE_OG_IMAGE = `${SITE_URL}/og.png`

/** studiodecho.com·붙여 쓴 브랜드 검색 신호 (메타·스키마·본문과 맞출 것) */
export const SITE_BRAND_COMPACT = 'studiodecho'

export const SITE_DESCRIPTION =
  'Studio DeCho is a Germany-based architecture and urban design studio exploring sustainable, culturally sensitive, and socially responsible spaces through an international perspective.'

/** Google은 keywords를 거의 쓰지 않지만, 다른 크롤러·브랜드 변형 힌트용 */
export const SITE_KEYWORDS = [
  'studiodecho',
  'Studio DeCho',
  'Studio Decho',
  'studiodecho.com',
  'architecture',
  'urban design',
  'Elvin Demiri',
  'Mo Cho',
].join(', ')

export const SITE_LOCALE = 'en'

export type RouteMeta = {
  title: string
  description?: string
  /** 검색·SNS 노출 제외 */
  noIndex?: boolean
}

const defaultMeta: RouteMeta = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
}

/** pathname → 페이지 메타 (`/admin` 등) */
export function metaForPath(pathname: string): RouteMeta {
  const path = pathname.replace(/\/+$/, '') || '/'

  if (path === '/admin' || path.startsWith('/admin/')) {
    return {
      title: `Admin · ${SITE_TITLE}`,
      description: 'Content administration',
      noIndex: true,
    }
  }

  const routes: Record<string, RouteMeta> = {
    '/': {
      title: `Work · ${SITE_TITLE}`,
      description:
        'Selected work by Studio DeCho (studiodecho) — drawings and artworks across urban and cultural contexts.',
    },
    '/news': {
      title: `News · ${SITE_TITLE}`,
      description: 'News and updates from Studio DeCho at studiodecho.com.',
    },
    '/info': {
      title: `Info · ${SITE_TITLE}`,
      description:
        'About Studio DeCho (studiodecho) — Elvin Demiri and Mo Cho, architects and urban designers in Germany.',
    },
  }

  return routes[path] ?? defaultMeta
}

export function documentTitleForRoute(pathname: string): string {
  const m = metaForPath(pathname)
  if (m.title === SITE_TITLE) return `${SITE_TITLE} | ${SITE_BRAND_COMPACT}`
  return m.title
}

export function canonicalUrlForPath(pathname: string): string {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return `${SITE_URL}/`
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

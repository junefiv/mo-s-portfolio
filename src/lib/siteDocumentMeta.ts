import {buildSiteJsonLd} from '@/lib/siteJsonLd'
import {
  SITE_BRAND_COMPACT,
  SITE_DESCRIPTION,
  SITE_FAVICON,
  SITE_KEYWORDS,
  SITE_LOCALE,
  SITE_OG_IMAGE,
  SITE_TITLE,
  canonicalUrlForPath,
  documentTitleForRoute,
  metaForPath,
} from '@/siteMeta'

const JSON_LD_SCRIPT_ID = 'site-json-ld'

function upsertMeta(
  attribute: 'name' | 'property',
  key: string,
  content: string,
) {
  const selector =
    attribute === 'name'
      ? `meta[name="${CSS.escape(key)}"]`
      : `meta[property="${CSS.escape(key)}"]`
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attribute, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function removeMeta(attribute: 'name' | 'property', key: string) {
  const selector =
    attribute === 'name'
      ? `meta[name="${CSS.escape(key)}"]`
      : `meta[property="${CSS.escape(key)}"]`
  document.head.querySelector(selector)?.remove()
}

function upsertJsonLd() {
  let el = document.getElementById(JSON_LD_SCRIPT_ID) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.id = JSON_LD_SCRIPT_ID
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(buildSiteJsonLd())
}

function upsertLink(rel: string, href: string, type?: string) {
  const selector = `link[rel="${CSS.escape(rel)}"]`
  let el = document.head.querySelector<HTMLLinkElement>(selector)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
  if (type) el.type = type
  else el.removeAttribute('type')
}

function upsertFavicon() {
  upsertLink('icon', SITE_FAVICON, 'image/png')
  upsertLink('apple-touch-icon', SITE_FAVICON)
}

/** SPA 라우트 변경 시 `<head>` 메타 동기화 */
export function applySiteDocumentMeta(pathname: string) {
  const route = metaForPath(pathname)
  const title = documentTitleForRoute(pathname)
  const description = route.description ?? SITE_DESCRIPTION
  const canonical = canonicalUrlForPath(pathname)
  const ogImage = SITE_OG_IMAGE

  document.title = title
  document.documentElement.lang = SITE_LOCALE

  upsertMeta('name', 'description', description)
  upsertMeta('name', 'keywords', SITE_KEYWORDS)
  upsertMeta('name', 'application-name', SITE_BRAND_COMPACT)
  upsertMeta('name', 'theme-color', '#ffffff')

  if (route.noIndex) {
    upsertMeta('name', 'robots', 'noindex, nofollow')
  } else {
    removeMeta('name', 'robots')
  }

  upsertLink('canonical', canonical)
  upsertFavicon()

  upsertMeta('property', 'og:type', 'website')
  upsertMeta('property', 'og:site_name', SITE_TITLE)
  upsertMeta('property', 'og:locale', SITE_LOCALE)
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', canonical)
  upsertMeta('property', 'og:image', ogImage)

  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)
  upsertMeta('name', 'twitter:image', ogImage)

  upsertJsonLd()
}

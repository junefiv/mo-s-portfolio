/**
 * GitHub Pages SPA 대응 + 검색 크롤러용 정적 HTML
 * - `/news`, `/info` 등에 물리 `index.html` → HTTP 200 (404.html 트릭은 404 상태 유지)
 * - `#root` 안에 라우트별 본문을 넣어 JS 실행 전에도 실제 콘텐츠 노출 (Soft 404 완화)
 */
import {createClient} from '@sanity/client'
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dist = join(__dirname, '..', 'dist')
const templatePath = join(dist, 'index.html')

const SITE_URL = 'https://studiodecho.com'
const SITE_TITLE = 'Studio DeCho'
const SITE_DESCRIPTION =
  'Studio DeCho is a Germany-based architecture and urban design studio exploring sustainable, culturally sensitive, and socially responsible spaces through an international perspective.'

const projectId = process.env.VITE_SANITY_PROJECT_ID ?? 'svd1v3dw'
const dataset = process.env.VITE_SANITY_DATASET ?? 'production'

const sanity = createClient({
  projectId,
  dataset,
  apiVersion: '2025-02-19',
  useCdn: false,
})

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function upsertTag(html, pattern, replacement) {
  if (pattern.test(html)) return html.replace(pattern, replacement)
  return html.replace('</head>', `  ${replacement}\n  </head>`)
}

function patchHead(html, {title, description, canonical}) {
  let out = html
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
  out = upsertTag(
    out,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapeHtml(description)}" />`,
  )
  out = upsertTag(
    out,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
  )
  out = upsertTag(
    out,
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
  )
  out = upsertTag(
    out,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
  )
  out = upsertTag(
    out,
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
  )
  out = upsertTag(
    out,
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
  )
  out = upsertTag(
    out,
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
  )
  return out
}

function injectRoot(html, innerHtml) {
  return html.replace(
    /<div id="root"><\/div>/,
    `<div id="root">${innerHtml}</div>`,
  )
}

function staticNav(activePath) {
  const links = [
    {path: '/news', label: 'NEWS'},
    {path: '/', label: 'WORK'},
    {path: '/info', label: 'INFO'},
  ]
  const items = links
    .map(({path, label}) => {
      const href = path === '/' ? '/' : path
      const active = path === activePath ? ' aria-current="page"' : ''
      return `<li><a href="${href}"${active}>${label}</a></li>`
    })
    .join('')
  return `<nav aria-label="Site"><ul>${items}</ul></nav>`
}

function workHtml(projects) {
  const items = projects
    .filter((p) => p.title)
    .map((p) => {
      const subs = [p.subTitle1, p.subTitle2, p.subTitle3].filter(Boolean)
      const subHtml = subs.length
        ? `<p>${subs.map((s) => escapeHtml(s)).join(' · ')}</p>`
        : ''
      const body = p.body ? `<p>${escapeHtml(p.body)}</p>` : ''
      return `<article><h2>${escapeHtml(p.title)}</h2>${subHtml}${body}</article>`
    })
    .join('\n')
  return `${staticNav('/')}
<main>
  <h1>Work · ${escapeHtml(SITE_TITLE)}</h1>
  <p>${escapeHtml(SITE_DESCRIPTION)}</p>
  ${items || `<p>${escapeHtml(SITE_DESCRIPTION)}</p>`}
</main>`
}

function newsHtml(posts) {
  const items = posts
    .filter((p) => p.title)
    .map((p) => {
      const date = (p.date ?? '').slice(0, 10)
      const body = p.body ? `<p>${escapeHtml(p.body)}</p>` : ''
      return `<article><h2>${escapeHtml(p.title)}</h2><time datetime="${escapeHtml(date)}">${escapeHtml(date)}</time>${body}</article>`
    })
    .join('\n')
  const description = 'News and updates from Studio DeCho at studiodecho.com.'
  return `${staticNav('/news')}
<main>
  <h1>News · ${escapeHtml(SITE_TITLE)}</h1>
  <p>${escapeHtml(description)}</p>
  ${items || `<p>${escapeHtml(description)}</p>`}
</main>`
}

const INFO_BIO = [
  'Elvin Demiri and Mo Cho are a Germany-based architectural duo of Albanian-Greek and Korean origin. Shaped by academic and professional experience across diverse cultural contexts, their work is informed by an international perspective on architecture, urban development, and societal transformation.',
  'Through collaborations with architectural practices in Germany, the United Kingdom, Greece, and South Korea, they have contributed to projects of various scales, ranging from urban developments to international architectural competitions.',
]

function infoHtml() {
  const description =
    'About Studio DeCho (studiodecho) — Elvin Demiri and Mo Cho, architects and urban designers in Germany.'
  const paragraphs = INFO_BIO.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n')
  return `${staticNav('/info')}
<main>
  <h1>Info · ${escapeHtml(SITE_TITLE)}</h1>
  <p>${escapeHtml(description)}</p>
  ${paragraphs}
  <p><strong>${escapeHtml(SITE_TITLE)}</strong><br />info@studiodecho.com</p>
</main>`
}

function writeRoute(filePath, html) {
  mkdirSync(dirname(filePath), {recursive: true})
  writeFileSync(filePath, html, 'utf8')
}

/** 예전 경로(`/work`, `/fabrication`) — 홈(Work)으로 보냄. 서버 404 대신 200 + canonical */
function redirectToHomeHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0;url=/" />
    <meta name="robots" content="noindex, follow" />
    <link rel="canonical" href="${SITE_URL}/" />
    <title>Work · ${escapeHtml(SITE_TITLE)}</title>
    <script>location.replace('/')</script>
  </head>
  <body>
    <p><a href="/">Studio DeCho — Work</a></p>
  </body>
</html>`
}

function writeRedirectRoute(segment) {
  writeRoute(join(dist, segment, 'index.html'), redirectToHomeHtml())
}

const workQuery = `*[_type == "workProject"] | order(projectNo desc) {
  title,
  "subTitle1": coalesce(subTitle1, subTitle),
  "subTitle2": coalesce(subTitle2, ""),
  "subTitle3": coalesce(subTitle3, ""),
  body,
  "imagesLeft": imagesLeft[]{ "url": asset->url },
  "imagesRight": imagesRight[]{ "url": asset->url }
}`

const newsQuery = `*[_type == "newsPost"] | order(publishedAt desc) {
  title,
  "date": publishedAt,
  body
}`

const template = readFileSync(templatePath, 'utf8')

const [workRows, newsRows] = await Promise.all([
  sanity.fetch(workQuery),
  sanity.fetch(newsQuery),
])

const workProjects = workRows
  .filter((r) => r.title)
  .filter((r) => {
    const left = (r.imagesLeft ?? []).some((x) => x?.url)
    const right = (r.imagesRight ?? []).some((x) => x?.url)
    return left && right
  })

writeRoute(
  join(dist, 'index.html'),
  injectRoot(
    patchHead(template, {
      title: `Work · ${SITE_TITLE}`,
      description: SITE_DESCRIPTION,
      canonical: `${SITE_URL}/`,
    }),
    workHtml(workProjects),
  ),
)

writeRoute(
  join(dist, 'news', 'index.html'),
  injectRoot(
    patchHead(template, {
      title: `News · ${SITE_TITLE}`,
      description: 'News and updates from Studio DeCho at studiodecho.com.',
      canonical: `${SITE_URL}/news/`,
    }),
    newsHtml(newsRows),
  ),
)

writeRoute(
  join(dist, 'info', 'index.html'),
  injectRoot(
    patchHead(template, {
      title: `Info · ${SITE_TITLE}`,
      description:
        'About Studio DeCho (studiodecho) — Elvin Demiri and Mo Cho, architects and urban designers in Germany.',
      canonical: `${SITE_URL}/info/`,
    }),
    infoHtml(),
  ),
)

writeRedirectRoute('work')
writeRedirectRoute('fabrication')

console.log(
  `Prerendered public routes (work: ${workProjects.length}, news: ${newsRows.length})`,
)

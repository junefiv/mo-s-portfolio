import {
  SITE_DESCRIPTION,
  SITE_OG_IMAGE,
  SITE_TITLE,
  SITE_URL,
} from '@/siteMeta'

/** 검색 엔진이 붙여 쓴·띄어 쓴 브랜드명을 같은 주체로 인식하도록 */
export const SITE_ALTERNATE_NAMES = [
  'studiodecho',
  'Studio Decho',
  'Studio DeCho',
] as const

export function buildSiteJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_TITLE,
        alternateName: [...SITE_ALTERNATE_NAMES],
        description: SITE_DESCRIPTION,
        inLanguage: 'en',
        publisher: {'@id': `${SITE_URL}/#organization`},
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_TITLE,
        alternateName: [...SITE_ALTERNATE_NAMES],
        url: SITE_URL,
        logo: SITE_OG_IMAGE,
        description: SITE_DESCRIPTION,
      },
    ],
  }
}

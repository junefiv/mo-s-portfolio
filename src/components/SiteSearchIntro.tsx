import {SITE_DESCRIPTION} from '@/siteMeta'

/** 검색 스니펫용 — 화면에는 숨기고 크롤러·스크린리더에는 노출 */
export default function SiteSearchIntro() {
  return <p className="sr-only">{SITE_DESCRIPTION}</p>
}

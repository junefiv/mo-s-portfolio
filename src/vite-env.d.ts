/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 정적 배포 시 관리 API를 다른 오리진(예: Vercel Functions)에 둔 경우 전체 URL (슬래시 없이). */
  readonly VITE_ADMIN_API_ORIGIN?: string
  /** Sanity 공개 읽기(미설정 시 studio와 동일 기본 프로젝트). */
  readonly VITE_SANITY_PROJECT_ID?: string
  readonly VITE_SANITY_DATASET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

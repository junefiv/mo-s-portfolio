import {createClient} from '@sanity/client'

/** 브라우저 공개 읽기 전용(토큰 없음). Studio·admin과 동일 프로젝트 기본값. */
const projectId = import.meta.env.VITE_SANITY_PROJECT_ID ?? 'svd1v3dw'
const dataset = import.meta.env.VITE_SANITY_DATASET ?? 'production'

export const sanityPublicClient = createClient({
  projectId,
  dataset,
  apiVersion: '2025-02-19',
  /** Studio/어드민에서 순서·내용을 바꾼 직후에도 맞는 순서를 보려면 CDN 비활성(쓰기 반영 지연 방지). */
  useCdn: false,
})

export {projectId as sanityProjectId, dataset as sanityDataset}

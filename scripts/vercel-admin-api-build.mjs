/**
 * Vercel(관리 API 전용) 배포: 대시보드가 dist 를 기대할 때 빈 출력 디렉터리를 만듭니다.
 * 실제 관리 엔드포인트는 api/admin/[path].ts 입니다.
 */
import {mkdirSync, writeFileSync} from 'node:fs'

mkdirSync('dist', {recursive: true})
writeFileSync(
  'dist/index.html',
  '<!DOCTYPE html><html><meta charset="utf-8"><title>Admin API</title><body><p>Portfolio site: GitHub Pages. This host only serves <code>/api/admin/*</code>.</p></body></html>\n',
)
console.log('vercel-admin-api-build: dist placeholder ready')

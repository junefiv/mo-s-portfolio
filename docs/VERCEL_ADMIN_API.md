# GitHub Pages + Vercel(무료)로 배포된 `/admin` 쓰기

GitHub Pages는 **정적 파일만** 올라가서 `/api/admin` 이 없습니다. 이 레포는 **같은 코드의 관리 API**를 Vercel Serverless(`api/admin/[path].ts` + `api/admin/portfolioAdminHandler.ts`)로 올릴 수 있게 되어 있습니다.

## 전체 흐름

1. **Vercel**에 이 GitHub 저장소를 연결하고, 환경 변수만 넣으면 `https://xxxx.vercel.app/api/admin/...` 주소가 생깁니다.
2. **GitHub Pages**용 프론트를 빌드할 때 `VITE_ADMIN_API_ORIGIN=https://xxxx.vercel.app` 을 넣으면, 브라우저의 `/admin` 이 그 주소로 API를 보냅니다.
3. Sanity 콘텐츠는 그대로 **Sanity**에서 관리합니다. 바뀌는 것은 “관리 API가 어디에 있느냐”뿐입니다.

---

## 1단계: Vercel 가입

1. 브라우저에서 [https://vercel.com](https://vercel.com) 을 엽니다.
2. 우측 상단 **Sign Up** → **Continue with GitHub** 를 선택합니다.
3. GitHub 로그인 후, Vercel이 저장소에 접근해도 된다는 **Authorize** 를 허용합니다.

---

## 2단계: 새 프로젝트 만들기 (관리 API 전용)

1. Vercel 대시보드에서 **Add New…** → **Project** 를 누릅니다.
2. **Import Git Repository** 목록에서 이 포트폴리오 저장소를 고릅니다. 안 보이면 **Adjust GitHub App Permissions** 로 저장소 접근을 넓힙니다.
3. **Import** 를 누릅니다.
4. 설정 화면에서 아래를 맞춥니다.
   - **Project Name**: 예) `mo-portfolio-admin` (아무 이름 가능)
   - **Framework Preset**: **Other** (또는 자동이면 그대로)
   - **Root Directory**: 비워 둡니다 (저장소 루트).
   - **Build Command**: 저장소에 `vercel.json` 이 있으면 `node -e "..."` 로 프론트 빌드는 건너뜁니다. 대시보드에서 **Override** 가 켜져 있으면, 내용을 **`echo skip`** 정도로 짧게 바꿔도 됩니다.
   - **Output Directory**: 비워 두거나 `.` — 함수만 배포하면 됩니다.
5. 아직 **Deploy** 누르지 말고, 다음 단계에서 환경 변수를 먼저 넣는 것을 권장합니다.

---

## 3단계: 환경 변수 넣기 (Vercel)

프로젝트 설정 **Settings** → 왼쪽 **Environment Variables** 로 갑니다. **Add New** 로 아래를 **Production**(그리고 필요하면 Preview)에 추가합니다.

| Name | 값 설명 |
|------|---------|
| `PORTFOLIO_ADMIN_SECRET` | `/admin` 로그인에 쓸 비밀번호. 로컬에서 쓰던 것과 같게 해도 되고, **운영에서는 더 긴 값**을 권장합니다. |
| `SANITY_API_WRITE_TOKEN` | Sanity **Editor**(또는 Administrator) 역할의 API 토큰. `sk` 로 시작하는 긴 문자열. [sanity.io/manage](https://www.sanity.io/manage) → 프로젝트 → **API** → **Tokens** 에서 발급합니다. |
| `VITE_SANITY_PROJECT_ID` | (선택) 로컬 `.env` 와 동일하게. 안 넣으면 코드 기본값이 쓰일 수 있습니다. |
| `VITE_SANITY_DATASET` | (선택) 보통 `production`. |

저장 후 **Deployments** 탭으로 돌아가 **Redeploy** 를 한 번 해 두면 안전합니다.

---

## 4단계: 배포하고 주소 확인

1. **Deploy** (또는 Redeploy)가 끝나면 프로젝트 상단에 **Domains** 가 보입니다. 예: `https://mo-portfolio-admin.vercel.app`
2. 브라우저 주소창에 아래를 직접 넣어 봅니다.  
   `https://여기에-본인-도메인.vercel.app/api/admin/work-list`  
   → 로그인 없이는 **401** JSON이 나오면 정상입니다(함수가 살아 있다는 뜻).

---

## 5단계: GitHub Pages 빌드에 `VITE_ADMIN_API_ORIGIN` 넣기

프론트는 여전히 GitHub Pages에 올리되, **빌드할 때** 아래 환경 변수를 넣어야 합니다.

- 이름: `VITE_ADMIN_API_ORIGIN`
- 값: `https://mo-portfolio-admin.vercel.app` 처럼 **슬래시 없이** Vercel 도메인만.

### GitHub Actions로 빌드하는 경우 (이 레포 기본)

`.github/workflows/deploy-github-pages.yml` 의 Build 단계에 이미 다음이 들어 있습니다.

`VITE_ADMIN_API_ORIGIN: ${{ secrets.VITE_ADMIN_API_ORIGIN }}`

GitHub 저장소에서 **Settings** → **Secrets and variables** → **Actions** → **New repository secret** 으로:

- **Name**: `VITE_ADMIN_API_ORIGIN` (이 이름과 **완전히 동일**해야 함)
- **Secret**: `https://본인-프로젝트.vercel.app` (끝에 `/` 없음)

저장한 뒤 **Actions** 탭에서 **Deploy to GitHub Pages** 워크플로를 다시 실행하거나 `main` 에 푸시하면, 빌드된 JS에 Vercel API 주소가 박힙니다. 시크릿을 안 넣으면 값이 비어 있어 `/admin` 이 여전히 GitHub Pages로만 요청을 보내고, 같은 JSON 오류가 납니다.

### 로컬에서 `npm run build` 후 `dist` 를 올리는 경우

빌드하는 PC에서:

```bash
set VITE_ADMIN_API_ORIGIN=https://본인-프로젝트.vercel.app
npm run build
```

(PowerShell 이면 `$env:VITE_ADMIN_API_ORIGIN="https://..."` 후 `npm run build`.)

---

## 6단계: 동작 확인

1. GitHub Pages에 올라간 사이트 주소로 들어갑니다.
2. `/admin` (또는 `/<저장소이름>/admin` — `base` 설정에 맞게) 으로 이동합니다.
3. Vercel에 넣은 `PORTFOLIO_ADMIN_SECRET` 과 동일한 값으로 로그인합니다.
4. 뉴스/워크/제작 업로드나 아카이브 순서 저장이 되면 성공입니다.

---

## 알아두면 좋은 것

- **무료(Hobby)** 플랜은 함수 실행 시간에 **상한**(예: 약 10초)이 있을 수 있습니다. 이미지를 아주 많이 한 번에 올리면 시간 초과가 날 수 있으면, 장수를 줄이거나 Vercel 플랜을 올리세요. `vercel.json` 의 `maxDuration` 을 조정할 수 있습니다(플랜에 따라 상한이 다름).
- 관리 API URL(`VITE_ADMIN_API_ORIGIN`)을 바꾼 뒤에는 **프론트를 다시 빌드·배포**해야 합니다(값이 빌드에 박이기 때문).
- CORS는 핸들러에서 이미 `Access-Control-Allow-Origin: *` 로 열려 있습니다.

---

## 문제가 생기면

- Vercel **Functions** 로그에서 해당 요청의 에러 메시지를 확인합니다.
- `SANITY_API_WRITE_TOKEN` 이 `sk` 토큰인지, 프로젝트/데이터셋이 맞는지 다시 확인합니다.
- GitHub Pages에서 **Mixed Content** (http 페이지에서 https API 호출 등)를 피하려면 사이트와 API 모두 **https** 여야 합니다.

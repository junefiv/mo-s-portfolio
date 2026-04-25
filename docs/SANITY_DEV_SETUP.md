# 다른 PC에서 클론 후 — Sanity 관련 세팅

포트폴리오 저장소(`mo-s-portfolio` 등)를 **새 PC에서 처음** 받아온 뒤, **웹 앱**과 **Sanity Studio**를 같이 쓰기 위한 절차입니다.

---

## 1. 공통 준비물

| 항목 | 설명 |
|------|------|
| **Node.js** | **LTS** 권장. [nodejs.org](https://nodejs.org) 설치 후 터미널을 **다시 연다.** |
| **Git** | 저장소 클론·풀용 |
| **Sanity 계정** | Studio 로그인에 쓰는 **Google / GitHub / 이메일** (이미 가입한 것과 동일) |

터미널에서 확인:

```bash
node -v
npm -v
git --version
```

---

## 2. 저장소 받기

```bash
git clone <저장소-URL>
cd <저장소-폴더명>   # 예: mo-s-portfolio
git pull             # 이미 클론했다면 최신만 받기
```

---

## 3. 포트폴리오(프론트) 의존성 설치

저장소 **루트**(Vite + React가 있는 곳, `package.json`이 있는 위치):

```bash
npm install
```

- 여기서 `node_modules`가 생깁니다. **Git에는 올리지 않으며**, 다른 PC마다 `npm install` 한 번씩 하면 됩니다.

### (선택) Vite에서 Sanity API를 쓰는 경우

루트에 **`.env.local`** 파일을 두고(이 파일은 `.gitignore`의 `*.local` 때문에 **커밋되지 않음**), 새 PC에서 **직접 다시 만든다**:

```env
VITE_SANITY_PROJECT_ID=svd1v3dw
VITE_SANITY_DATASET=production
```

값은 [sanity.io/manage](https://www.sanity.io/manage) → 해당 프로젝트에서 확인한다.  
팀원과 공유할 때는 **비밀번호·토큰이 들어가지 않게** ID/데이터셋 이름만 공유하고, 각자 로컬에 `.env.local`을 만든다.

---

## 4. Sanity Studio 폴더

이 저장소에는 **`studio-studio-decho/`** 디렉터리가 포함되어 있다(별도의 작은 앱).

```bash
cd studio-studio-decho
npm install
npm run dev
```

- 터미널에 나오는 주소(보통 **`http://localhost:3333`**)를 브라우저로 연다.
- **로그인** 화면이 나오면, Sanity에 쓰는 **같은 계정**으로 로그인한다.
- 첫 실행 시 **`/.sanity`** 같은 로컬 생성물이 생길 수 있다. 이 폴더는 **`.gitignore`에 있어 커밋되지 않는다** → 다른 PC에서도 `npm run dev`로 자동 생성되면 된다.

### Studio만 쓸 때 자주 쓰는 명령

| 명령 | 설명 |
|------|------|
| `npm run dev` | 로컬에서 Studio 개발 서버 |
| `npm run build` | Studio 정적 빌드 |
| `npm run deploy` | 호스팅된 Studio 배포 (`sanity deploy`) |

---

## 5. “다운받는 것” 정리

| 무엇을 | 어떻게 |
|--------|--------|
| **npm 패키지** | 루트 `npm install` + `studio-studio-decho` 안에서 `npm install` |
| **Sanity Studio 앱 자체** | 이미 Git에 포함된 `studio-studio-decho` 소스를 **풀**하면 됨. 별도 설치 프로그램 없음 |
| **콘텐츠(글·이미지)** | Studio가 **Sanity 클라우드**의 dataset에 붙어 있음. 같은 `projectId` / `dataset`이면 **어느 PC에서든** 로그인 후 동일 데이터 편집 |
| **Sanity CLI만** 쓰고 싶다면 | 전역 없이 `npx sanity@latest --help` 또는 Studio 디렉터리에서 `npx sanity login` 등 |

---

## 6. 프론트에서 API로 불러올 때 (CORS)

브라우저에서 `https://api.sanity.io` 등으로 요청하면, Sanity 프로젝트 설정에 **CORS origin**을 등록해야 한다.

[sanity.io/manage](https://www.sanity.io/manage) → 프로젝트 → **API** → **CORS origins**에 예:

- `http://localhost:5173` (Vite 로컬)
- 배포 도메인 (예: GitHub Pages URL)

---

## 7. 푸시 전 체크리스트 (본인 PC)

- [ ] `.env.local` / 비밀 토큰이 **커밋에 포함되지 않았는지**
- [ ] `node_modules`, `studio-studio-decho/node_modules`는 **커밋하지 않음** (저장소 `.gitignore`에 의해 제외)
- [ ] `studio-studio-decho` 변경사항(스키마 등)을 **푸시**해 두었는지

---

## 8. 문제가 생기면

1. **Node 버전**을 LTS로 맞춘 뒤 `node_modules` 삭제 → `npm install` 재실행  
2. Studio: `studio-studio-decho`에서 `npm run dev` 로그의 **URL·에러 메시지** 확인  
3. **로그인 계정**이 프로젝트 멤버인지 [Manage](https://www.sanity.io/manage)에서 확인  

에러 문구 전체를 복사해 두면 원인 파악이 빠르다.

---

*문서 기준 프로젝트 ID: `svd1v3dw`, dataset: `production`, Studio 경로: `studio-studio-decho/`. 저장소 구조가 바뀌면 이 문서도 함께 수정한다.*

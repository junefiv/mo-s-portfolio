# AI / collaborator guidelines

이 파일은 프로젝트 작업 시 참고할 규칙을 정리합니다. 필요에 따라 섹션을 추가하거나 수정하세요.

## General

- 꼭 필요할 때만 absolute 포지션을 쓰고, 기본은 flexbox·grid 기반의 반응형 레이아웃을 사용합니다.
- 컴포넌트와 헬퍼는 역할별로 작은 파일로 나눕니다.
- 리팩터링은 요청 범위 안에서만 진행하고, 관련 없는 대규모 정리는 피합니다.

## Design tokens

- 기본 글자 크기: `16px` (`:root`의 `--font-size`).
- 색·반경·타이포는 `src/index.css`의 CSS 변수와 Tailwind `@theme inline` 매핑을 따릅니다.

## Navigation / routing

- 라우트: `/`, `/academics`, `/work`, `/fabrication`, `/info`.
- 클라이언트 라우팅은 React Router(`react-router`)를 사용합니다.

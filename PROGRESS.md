# PROGRESS — p-digit.github.io

> 진행 현황과 백로그. 작업을 시작할 때 읽고, 끝낼 때 갱신해서 커밋에 포함한다.

## [완료된 작업]

- 2026-11-26 Quartz v5 블로그 시작, 노션 동기화 + GitHub Pages 배포 파이프라인 (`deploy.yml`, `scripts/notion-sync.mjs`)
- 2026-11-26 사이트 제목을 'P-digit 개발 기록'으로 변경
- 2026-11-27 프로젝트 분석 문서 작성: `CLAUDE.md` 1번 섹션, `DESIGN_SPEC.md`, `PROGRESS.md` / `.gitignore`에 빌드 산출물 추가
- 2026-11-27 **[PR 1] 첫 화면 랜딩 허브** (`design/home-landing`, Gemini 검수 2회차 `<DONE>`)
  - 소개 hero 카드 + 바로가기 카드 3개(전체 노트 · Isaac Sim · ROS 2) + 주제별 태그 칩
  - `recent-notes` 플러그인 활성화, `quartz.ts`에 `is-index` 레이아웃 조건 등록 → 첫 화면에만 "최근 학습 노트" 5개 자동 표시
  - 깨진 `tags/에러-해결` 링크 제거(빌드 경고 0건), 첫 화면 수정일·읽기 시간 숨김

## [알려진 UI/기능 이슈]

2026-11-27 로컬 빌드(`npx quartz build`)와 1440px · 375px 화면을 직접 확인한 결과.

1. ~~첫 화면이 비어 보임~~ — PR 1에서 해결
2. ~~깨진 태그 링크 `tags/에러-해결`~~ — PR 1에서 해결
3. **글 목록(`/notes/`)의 날짜가 두 줄로 꺾임** — "2026년 11월 / 26일". 태그가 세로로 길게 쌓여 행 높이가 들쭉날쭉하다. 모바일에서는 태그가 숨겨진다.
4. **모바일 헤더 제목 줄바꿈** — 375px에서 "P-digit 개발 / 기록"이 두 줄로 꺾인다.
5. **글 상단의 Properties 패널** — description·tags가 원시 속성 표로 드러나 본문 시작이 아래로 밀린다(모바일에서 특히 길다).
6. **영문 UI 문자열 섞임** — "1 min read", 폴더 이름 "notes", "Home", "Created with Quartz".
7. **표가 모바일 폭을 약간 넘음** — 3일차 글의 표가 375px에서 6px 넘친다(표 컨테이너 안에서 가로 스크롤은 됨).
8. **로컬 도구 미설치** — 이 PC에 시스템 Node와 `gh` CLI가 없고 git push 자격 증명도 없다(Node는 `~/.local/opt`에 설치함).
9. **첫 화면 태그 칩은 손으로 관리** — `content/index.md`의 카드·태그 칩은 고정 마크업이다. 노션에 새 태그가 생기면 칩을 추가해야 한다(최근 노트 목록은 자동).
10. **recent-notes 태그는 소문자 슬러그로 표시** — `#isaac-sim`처럼 보인다(플러그인 기본 동작). 글 목록 PR에서 함께 다룬다.

## [다음 디자인/기능 백로그]

우선순위 순. 2026-11-27 Gemini 디자이너 로드맵(PR 1개 = 섹션 1개) 기준.

1. ~~[PR 1] 첫 화면 랜딩 허브~~ ✅
2. **[PR 2] 글 목록(`/notes/` · 태그 페이지)** — 날짜 한 줄 고정(`white-space: nowrap`), 태그 칩 가로 래핑, 행 hover, 모바일 태그 표시. 첫 화면 recent-notes 행과 같은 시각 언어로 통일
3. [PR 3] 모바일 헤더 · 전역 타이포그래피 — 375px 제목 한 줄, `word-break: keep-all`
4. [PR 4] 글 머리 정리 — Properties 패널 축소/숨김, 날짜·읽기 시간 뱃지화
5. [PR 5] 본문 가독성 — 표 모바일 넘침, 코드 블록 라운딩·복사 버튼, 콜아웃, 이전/다음 글 내비게이션(Gemini 2차 제안)
6. [PR 6] UI 문자열 한국어화와 footer 정리 — "min read", "Created with Quartz", 폴더명 `notes`

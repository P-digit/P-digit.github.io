# p-digit.github.io 블로그 개발 및 디자인 자동화 가이드 (CLAUDE.md)

너는 기술 블로그(`https://p-digit.github.io/`)의 **시니어 프론트엔드 & UI 구현 엔지니어**다.
모든 디자인 개편, 레이아웃 수정, 기능 추가는 프로젝트 진행 맥락을 유지하면서 수석 디자이너(Gemini)의 검수를 거쳐 GitHub Pull Request(PR)로 제출한다.

---

## 1. 프로젝트 개요 및 실행 환경

- **사이트 URL:** `https://p-digit.github.io/`
- **기술 스택 파악:** 첫 작업 시 루트 파일(`_config.yml`, `package.json`, `index.html`, `astro.config.*` 등)을 확인해 정적 사이트 생성기(Jekyll, Astro, Next.js, 순수 HTML/CSS 등)와 로컬 빌드 명령어를 파악하고 이 섹션에 기록한다.

### 파악된 스택 (2026-11-27 분석)

- **정적 사이트 생성기:** [Quartz v5.2.2](https://quartz.jzhao.xyz) (TypeScript + Preact SSR + SCSS, SPA 라우팅). 대부분의 UI는 `node_modules/@quartz-community/*` 플러그인이 렌더링한다.
- **Node:** `.node-version` = 22.22.0 (CI는 Node 24). 이 PC에는 시스템 Node가 없어서 `~/.local/opt/node-v22.22.0-linux-x64`에 설치해 두었다 → `export PATH=~/.local/opt/node-v22.22.0-linux-x64/bin:$PATH`
- **콘텐츠:** `content/index.md`(첫 화면), 범주 폴더 5개 `content/{robotics,algorithm,embedded,dev,retro}/`. 각 폴더의 `index.md`(범주 소개)는 손으로 관리하고, 나머지 `*.md` 글은 노션 '학습 기록' DB의 `카테고리` 속성에 따라 `scripts/notion-sync.mjs`가 생성한다. **동기화가 만든 글(`.notion-sync/manifest.json`에 있는 파일)은 덮어쓰이므로 직접 수정하지 않는다.** 범주를 추가하려면 노션 선택지 + `CATEGORIES` 매핑 + `content/<폴더>/index.md`를 함께 만든다.
- **설정:** `quartz.config.yaml` (사이트 제목, `locale: ko-KR`, `baseUrl: p-digit.github.io`, 글꼴·색상 토큰, 플러그인 on/off·레이아웃 위치)
- **커스텀 스타일:** `quartz/styles/custom.scss` (전역 SCSS 진입점에서 마지막에 로드됨). 기본값은 `base.scss`, `variables.scss`(브레이크포인트 mobile 800px / desktop 1200px), `callouts.scss`, `syntax.scss`
- **배포:** `.github/workflows/deploy.yml` — `main` push / 3시간마다 cron / 수동 실행 시 노션 동기화 → `npx quartz build` → GitHub Pages. 봇이 `main`에 "노션 동기화" 커밋을 직접 올리므로 PR 전 `git fetch`로 최신화한다.

### 로컬 명령어

```bash
npm ci                                   # 의존성 설치 (플러그인 포함)
npx quartz build                         # 빌드 → public/
npx quartz build --serve --port 8080     # 미리보기 http://localhost:8080
npx prettier --check quartz/styles quartz.config.yaml   # 스타일/설정 포맷 검사
```

- 빌드 산출물 `public/`, `node_modules/`, `quartz/.quartz-cache/`는 커밋하지 않는다(.gitignore).
- 반응형 검증: 브라우저 창 크기 조절이 막혀 있으면 375px 폭 `<iframe>`으로 띄우고 `documentElement.scrollWidth`가 375인지 확인한다.

---

## 2. 프로젝트 진행 및 디자인 시스템 관리

세션이 바뀌어도 디자인 일관성과 진행 상황이 유지되도록 아래 문서를 프로젝트 루트에 관리한다. (파일이 없다면 첫 작업 시 현재 사이트 구조를 분석해 생성한다.)

- **`DESIGN_SPEC.md` (디자인 및 구조 명세):** 컬러 팔레트(라이트/다크 모드), 폰트/타이포그래피 규칙, 레이아웃 구조, 주요 컴포넌트 목록
- **`PROGRESS.md` (진행 현황 및 백로그):**
  - `[완료된 작업]`: 디자인 개선 및 검수가 끝난 항목
  - `[알려진 UI/기능 이슈]`: 깨지는 레이아웃, 반응형 문제, 누락된 기능
  - `[다음 디자인/기능 백로그]`: 이어서 꾸밀 우선순위 목록

### 진행 원칙

1. **작업 시작 시:** `DESIGN_SPEC.md`, `PROGRESS.md`, `git status`를 먼저 확인한다.
2. **작업 단위 분할:** 한 번에 사이트 전체를 뒤엎지 않고, **PR 1개 = 섹션/기능 1개** (예: 헤더/네비게이션, 포스트 카드 그리드, 다크모드 토글, 코드 블록 스타일링 등) 단위로 작게 끊어 완결한다.
3. **작업 종료 시:** 코드 수정이 끝나면 반드시 `DESIGN_SPEC.md`와 `PROGRESS.md`를 최신화한 뒤 커밋에 포함한다.

---

## 3. UI/UX 및 프론트엔드 코딩 기준

- **반응형 필수:** 모바일(375px)과 데스크톱(1440px) 양쪽에서 가로 스크롤이 생기거나 텍스트가 겹치지 않도록 작성한다.
- **기존 콘텐츠 보호:** `_posts/` 등 기존 블로그 게시글 마크다운 파일의 본문 내용은 사용자 지시 없이 임의로 삭제하거나 변형하지 않는다.
- **에셋 및 경로 일관성:** 이미지, CSS, JS 경로는 GitHub Pages 루트 배포 경로 기준으로 깨지지 않게 상대/절대 경로를 맞춘다.

---

## 4. 작업 전 Git 브랜치 격리

1. 작업 시작 전 현재 브랜치를 확인한다(`git branch --show-current`).
2. 현재 브랜치가 `main`(또는 `master`)이라면 반드시 최신 상태를 확인한 뒤 작업 목적에 맞는 새 브랜치를 생성하고 전환한다.
   - 디자인/UI 개선: `git checkout -b design/<작업명>`
   - 기능 추가: `git checkout -b feat/<기능명>`
   - 스타일/버그 수정: `git checkout -b fix/<수정명>`

---

## 5. 자율 개발 및 Gemini 디자인 검수 루프

사용자가 블로그 개선 목표를 주거나 `PROGRESS.md`의 다음 항목 진행을 요청하면, 아래 절차를 `<DONE>` 판정이 나올 때까지 반복한다.

1. **구현 및 스타일링:** 목표 UI/기능 코드를 작성하거나 수정한다.
2. **로컬 빌드 및 문법 검증:**
   - 프로젝트 스택에 맞는 빌드 명령어(예: `npm run build`, `bundle exec jekyll build`, 또는 HTML/CSS/JS 문법 및 깨진 링크 검증 스크립트)를 Bash로 실행해 빌드 에러가 없는지 확인한다.
3. **Gemini 디자이너 검수 호출:** `consult_gemini_designer` MCP 도구를 호출한다.
   - `project_dir`: 현재 프로젝트 루트 절대 경로
   - `current_task`: 현재 달성하려는 구체적 디자인/기능 목표
   - `build_or_lint_log`: 2단계 로컬 빌드 및 검증 결과 로그
   - `focus_files`: 방금 수정했거나 연관된 핵심 파일 경로 리스트 (HTML, CSS, 레이아웃 파일 등)
4. **피드백 반영 및 루프 제어:**
   - Gemini 응답 끝에 `<DONE>`이 **없다면**, 지적된 UI 결함·반응형 문제·개선 제안을 반영해 수정하고 2~3단계를 반복한다.
   - 단, **동일한 이슈로 4회 이상 `<DONE>`에 도달하지 못하면** 무한 루프를 방지하기 위해 즉시 중단하고 현재 상태와 원인을 사용자에게 보고한다.
   - Gemini 응답 끝에 `<DONE>`이 **포함되어 있다면**, 아래 **6단계(문서 갱신 및 PR 생성)**로 넘어간다.

---

## 6. 완료 후 문서 갱신 및 GitHub PR 자동 생성

`<DONE>` 판정을 받으면 다음 절차를 순서대로 실행한다.

1. **진행 문서 업데이트:** `PROGRESS.md`와 `DESIGN_SPEC.md`에 반영된 디자인 규칙과 다음 추천 작업을 업데이트한다.
2. **커밋 및 푸시:**
   - `git status`와 `git diff --stat`을 확인한 뒤 스테이징 및 커밋한다. (`git add . && git commit -m "design/feat: 변경 요약"`)
   - 현재 작업 브랜치를 원격 저장소에 푸시한다. (`git push -u origin HEAD`)
3. **PR 생성 (Merge 금지):**
   - `gh pr create --base main` 명령으로 Pull Request를 생성한다.
   - PR 본문에는 다음 4가지를 반드시 포함한다:
     1. **UI/기능 변경 요약**
     2. **로컬 빌드 및 반응형 검증 결과**
     3. **Gemini 디자이너 검수 반영 내역**
     4. **로컬 미리보기 방법 및 다음 추천 작업 (`PROGRESS.md` 기준)**
4. **최종 보고:** 생성된 **PR URL 링크**, 변경 내용 요약, 로컬 서버에서 직접 화면을 확인하는 명령어를 사용자에게 보고하고 종료한다.

---

## 7. 절대 금지 사항

- **`gh pr merge` 명령은 어떠한 경우에도 절대 실행하지 마라.** `main`에 합쳐지면 라이브 사이트에 즉시 반영되므로, 반드시 사용자가 직접 확인 후 Merge 한다.
- **`main` / `master` 브랜치에 직접 커밋하거나 `git push` 하지 마라.**
- **`git push --force`, `git reset --hard` 등 이력을 파괴하는 명령은 사용자 명시적 승인 없이 실행하지 마라.**

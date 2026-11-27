# DESIGN_SPEC — p-digit.github.io

> 디자인 및 구조 명세. 모든 UI 작업은 이 문서의 토큰·규칙을 따르고, 바뀐 규칙은 작업 PR에서 함께 갱신한다.
> 기준 버전: Quartz v5.2.2 · 최종 갱신 2026-11-27

## 1. 사이트 성격

- **이름:** P-digit 개발 기록 (`pageTitle`) / 첫 화면 제목도 "P-digit 개발 기록"
- **내용:** 여러 범주를 다루는 개인 개발 블로그(2026-11-27 확장 결정). 지금 올라온 글은 NVIDIA AI Campus 로보틱스 과정(Isaac Sim · ROS 2 · Isaac Lab) 일차별 노트뿐이다. 한국어 장문 + 표 + 코드 블록이 많다.
- **독자 경험 목표:** 범주로 먼저 고르고, 범주 안에서는 순서대로 따라 읽기 쉽고, 태그(주제)로 범주를 넘어 되찾기 쉬우며, 긴 글을 모바일에서도 편하게 읽는 것.

### 1.1 정보 구조 (범주 = 폴더 = URL)

| 범주     | 폴더 / URL    | 노션 `카테고리` | 비고                                                  |
| -------- | ------------- | --------------- | ----------------------------------------------------- |
| 로보틱스 | `/robotics/`  | 로보틱스        | DLI 과정 노트. 옛 `/notes/…` 주소가 여기로 리다이렉트 |
| 알고리즘 | `/algorithm/` | 알고리즘        | 문제 풀이 · 자료구조                                  |
| 임베디드 | `/embedded/`  | 임베디드        |                                                       |
| 개발     | `/dev/`       | 개발            | 그 밖의 개발 글. 카테고리를 비우면 기본값             |
| 회고     | `/retro/`     | 회고            |                                                       |

- 범주는 폴더 하나로만 정한다(글 하나 = 범주 하나). 범주를 넘나드는 주제는 태그로 묶는다.
- 노션 `카테고리`가 비어 있으면: `일차`·`강의명`이 있으면 로보틱스, 아니면 개발.
- 글의 폴더나 슬러그가 바뀌면 동기화 스크립트가 옛 경로를 `aliases`로 남겨 옛 링크가 리다이렉트된다.
- 범주 소개 `content/<폴더>/index.md`는 `title` + 본문 한두 문장. 범주 목록 페이지에서는 작성일·읽기 시간을 숨기고, 글이 없으면 "아직 올라온 글이 없습니다."를 보여 준다.

## 2. 컬러 팔레트 (`quartz.config.yaml > theme.colors`) — A안 "Precision Tech" (PR 12)

2026-11-27 사용자 결정: Linear·Vercel·Stripe 문서 같은 쿨 슬레이트 + 로열 블루. Quartz는 아래 토큰을 CSS 변수(`var(--light)` 등)로 노출한다. 새 색을 하드코딩하지 말고 토큰이나 `color-mix()`로 파생한다.

| 토큰              | 용도                       | Light                 | Dark                   |
| ----------------- | -------------------------- | --------------------- | ---------------------- |
| `--light`         | 페이지 배경                | `#ffffff`             | `#0b0f17`              |
| `--lightgray`     | 테두리·구분선·면           | `#e2e8f0`             | `#1e293b`              |
| `--gray`          | 비활성·그래프 노드         | `#94a3b8`             | `#64748b`              |
| `--darkgray`      | 본문 텍스트                | `#334155`             | `#cbd5e1`              |
| `--dark`          | 제목·강조 텍스트           | `#0f172a`             | `#f8fafc`              |
| `--secondary`     | 링크·사이트 제목·포인트 색 | `#2563eb`             | `#60a5fa`              |
| `--tertiary`      | hover·완료 상태 (틸)       | `#0d9488`             | `#2dd4bf`              |
| `--highlight`     | 칩·내부 링크 배경          | `rgba(37,99,235,.08)` | `rgba(96,165,250,.14)` |
| `--textHighlight` | `==형광펜==`               | `#fef08a99`           | `#ca8a0466`            |

- 대비(라이트): 본문 `#334155` / `#fff` 10.35:1, 링크 `#2563eb` 5.17:1 (WCAG AA 이상).
- 다크 모드: `@quartz-community/darkmode` 토글이 `html[saved-theme="dark"]`를 바꾼다. 커스텀 스타일은 변수만 쓰면 양쪽 모드가 자동으로 맞는다.
- 코드 하이라이트: Shiki `github-light` / `github-dark`, `keepBackground: false` (슬레이트 팔레트와 어울림)

### 2.1 모서리 · 그림자 토큰 (`custom.scss :root`)

| 토큰               | 값                                      | 쓰임                    |
| ------------------ | --------------------------------------- | ----------------------- |
| `--radius-card`    | 10px                                    | 카드                    |
| `--radius-surface` | 8px                                     | 코드 블록·표·콜아웃     |
| `--radius-chip`    | 6px                                     | 태그 칩(PR 14에서 적용) |
| `--shadow-sm`      | `0 1px 2px color-mix(--dark 4%)`        | 평소 카드               |
| `--shadow-md`      | `0 6px 16px -4px color-mix(--dark 12%)` | hover로 떠오를 때       |

## 3. 타이포그래피 (PR 12)

| 역할                  | 글꼴                | 불러오는 곳                                                                  |
| --------------------- | ------------------- | ---------------------------------------------------------------------------- |
| 제목·본문·사이트 제목 | Pretendard Variable | jsDelivr CDN dynamic subset (`plugins/post-extras` 의 `stylesheets` 옵션)    |
| 대체 글꼴             | Noto Sans KR        | Google Fonts (`theme.typography`). Pretendard에 없는 글자·CDN 실패 때만 받음 |
| 코드 (`--codeFont`)   | JetBrains Mono      | Google Fonts                                                                 |

- 글꼴 변수는 `custom.scss :root`에서 덮는다(`--bodyFont`·`--headerFont`·`--titleFont`·`--font-text`·`--font-interface`). fonts 플러그인이 레이어 밖에 `h1~h6 { font-family }`를 넣으므로 제목은 `html body :is(h1…h6, .page-title)`로 덮는다.
- 자간: 본문 `-0.01em`, 제목 `-0.025em`, 코드 `0`. 글꼴 매끄럽게(`-webkit-font-smoothing: antialiased`).
- 행간: 글 본문 `p`·`li` 1.75(16px → 28px). 표 1.55, 코드 1.65.
- 제목 크기(base.scss): h1 1.75rem(글 제목 `article > h1` 2rem), h2 1.4rem, h3 1.12rem, h4~h6 1rem. 굵기: 본문 400, 링크·`strong` 600, 제목 700.
- 본문 속 링크: 형광 배경 없이 1px 밑줄(`color-mix(--secondary 35%)`, offset .22em), hover 때 밑줄 진하게. 태그 칩·이미지 링크는 제외.
- 선택 영역: `color-mix(--secondary 22%)`.
- 한국어 장문 규칙(PR 3에서 전역 적용): `body { word-break: keep-all; overflow-wrap: break-word }`. 어절 단위로 줄바꿈하고, 긴 영문·경로는 `break-word`로 넘침만 막는다. `anywhere`는 표 칸의 최소 폭까지 줄여 표가 찌그러지므로 본문에는 쓰지 않는다. `pre`, `code`는 `word-break: normal`.

## 4. 레이아웃 구조

브레이크포인트(`quartz/styles/variables.scss`): **mobile ≤ 800px**, tablet 800–1200px, **desktop ≥ 1200px**. 사이드 패널 폭 320px, 최대 페이지 폭 1500px.

| 영역            | Desktop                                                                 | Mobile                                               |
| --------------- | ----------------------------------------------------------------------- | ---------------------------------------------------- |
| 왼쪽 사이드바   | 사이트 제목 → [검색 · 다크모드 · 리더모드] 툴바 → 탐색기                | 상단 가로 헤더 (☰ + 제목 한 줄 + 아이콘 툴바, 69px) |
| beforeBody      | 브레드크럼(현재 항목 숨김) → 글 제목 → 날짜·읽기시간 → 요약·태그 (§7.5) | 같음                                                 |
| 본문            | `article`                                                               | 같음                                                 |
| 오른쪽 사이드바 | 그래프 뷰 → 목차(TOC) → 백링크                                          | 본문 아래로 내려감                                   |
| footer          | "© 2026 P-digit · Quartz로 만들었습니다" + GitHub 링크 (`site-footer`)  | 같음                                                 |

페이지 유형별 차이(`layout.byPageType`): 폴더·태그 페이지는 오른쪽 사이드바 없음, 리더 모드 버튼 제외.

## 5. 주요 컴포넌트

| 컴포넌트                 | 플러그인                                                | 위치                                         | 비고                                      |
| ------------------------ | ------------------------------------------------------- | -------------------------------------------- | ----------------------------------------- |
| 사이트 제목              | page-title                                              | left                                         |                                           |
| 검색                     | search                                                  | left/toolbar                                 | 전체 텍스트 검색 + 미리보기               |
| 다크모드 / 리더모드      | darkmode / reader-mode                                  | left/toolbar                                 |                                           |
| 탐색기                   | explorer                                                | left                                         | 폴더 `notes`                              |
| 브레드크럼               | breadcrumbs (`rootName: 홈`)                            | beforeBody                                   | 홈 제외, 현재 항목 숨김                   |
| 글 제목·메타             | article-title / ./plugins/post-meta (content-meta 대체) | beforeBody                                   | 날짜 + "약 N분"                           |
| 노트 속성                | note-properties                                         | beforeBody                                   | description·tags 표시 (aliases는 숨김)    |
| 그래프 / 목차 / 백링크   | graph / table-of-contents / backlinks                   | right                                        |                                           |
| 글 목록                  | folder-page / tag-page                                  | 본문                                         | 제목 → 날짜 → 태그 칩 세로 스택 (PR 2)    |
| 최근 글                  | recent-notes                                            | afterBody (`condition: is-index`, 첫 화면만) | 전 범주 5개, 제목 · 날짜 · 태그 칩        |
| 홈 hero / 카드 / 태그 칩 | `content/index.md` 마크업 + `custom.scss`               | 첫 화면 본문                                 | `.home-hero`, `.home-cards`, `.home-tags` |
| 콜아웃                   | obsidian-flavored-markdown                              | 본문                                         | 노션 토글 → 접히는 콜아웃                 |
| 코드 복사 · 언어 라벨    | ./plugins/post-extras (transformer 스크립트)            | 본문 코드 블록 `figure` 오른쪽 위            | `.code-actions` (§7.7)                    |
| 이전/다음 글             | ./plugins/post-extras (`PostNav`)                       | afterBody (priority 1)                       | 같은 범주 안 날짜순 (§7.7)                |

## 6. 커스터마이징 규칙

1. **스타일 수정은 `quartz/styles/custom.scss`에만** 한다. `base.scss` 등 Quartz 기본 파일과 `node_modules` 플러그인은 업스트림 업데이트를 위해 건드리지 않는다.
2. 플러그인 클래스(`.page-title`, `.section-li`, `.explorer` 등)를 셀렉터로 쓰고, 반응형은 `@use "./variables.scss" as *;` 후 `@media all and ($mobile)`로 작성한다.
3. 콘텐츠·레이아웃 on/off는 `quartz.config.yaml`에서 한다.
4. 반응형 검증 기준: 375px / 1440px에서 `documentElement.scrollWidth`가 화면 폭을 넘지 않을 것.

## 7. 적용된 커스텀 디자인 규칙

(작업 PR마다 아래에 추가한다)

### 7.1 공통 컴포넌트 토큰 (PR 1에서 정의, 이후 PR도 재사용)

| 요소                   | 규칙                                                                                                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 카드                   | `1px solid var(--lightgray)`, radius 10px, 배경 `var(--light)`. hover/focus: `translateY(-2px)` + 테두리 `var(--secondary)` + 그림자 `color-mix(--dark 8%)`, 0.15s                           |
| 강조 패널(hero)        | radius 12px, 왼쪽 4px `var(--secondary)` 보더, 배경 `color-mix(in srgb, var(--secondary) 5%, var(--light))`                                                                                  |
| 칩(태그·뱃지)          | radius 999px, 배경 `var(--highlight)`, 글자 `var(--secondary)`, `#` 접두는 opacity .6, hover 시 테두리 secondary. 보조 칩은 투명 배경 + lightgray 테두리                                     |
| 보조 텍스트(날짜·라벨) | `--gray`는 라이트 모드 대비가 낮아 텍스트에 쓰지 않는다 → `color-mix(in srgb, var(--darkgray) 75%, var(--light))`                                                                            |
| 링크형 블록            | `text-decoration: none` 명시, 진입 화살표 `→`(기본 `--gray`, hover `--secondary` + `translateX(3px)`)                                                                                        |
| 리스트 행              | `@mixin note-row` / `note-tags` (custom.scss). 위아래 `1px solid var(--lightgray)` 구분선, 행 padding 0.85rem 0.75rem, 제목→날짜(nowrap)→태그 칩, hover·focus-within 배경 `var(--highlight)` |

### 7.2 첫 화면 — 범주 허브 (PR 1 → PR 5에서 개편)

- 페이지 제목 "P-digit 개발 기록". 순서: 글 제목(h1, PR 15부터 화면에서만 숨김) → hero(뱃지 "개인 개발 블로그" + lead + sub) → "범주" 소제목(`h2.home-section-title`, 1.12rem) → 범주 카드 5개(`nav.home-cards`, `aria-label="범주"`) → (본문 끝 구분선) → 태그 칩(`plugins/home-tags`, afterBody) → 최근 글
- 범주 카드 그리드: 2열. **연재 중인 범주는 `.home-card--featured`**(`grid-column: 1 / -1`, 배경 `color-mix(--secondary 4%)`, "연재 중" 뱃지 `.home-card__badge`, 아이콘 2rem)로 한 줄 전체, 나머지 4개는 2×2. 모바일(≤800px)은 1열. `auto-fit`은 본문 750px에서 3+2로 떨어져 쓰지 않는다.
- 연재 중인 범주가 바뀌면 `--featured` 클래스와 뱃지를 옮긴다. 범주 카드 설명은 짧은 키워드(`·` 구분), featured만 한 문장.
- 첫 화면에서는 `.content-meta`(수정일·읽기 시간)를 숨긴다 (`body[data-slug="index"]`).
- 마크업 링크는 Quartz 실제 슬러그(소문자, 상대경로 `./tags/ros-2`, 폴더는 `./robotics/`)와 `class="internal"`을 쓴다.
- 레이아웃 조건 `is-index`는 `quartz.ts`에서 `registerCondition`으로 등록한다.
- 탐색기 순서: `quartz.config.yaml` explorer `sortFn`(YAML 문자열 함수)으로 범주 폴더를 §1.1 표 순서로, 그 밖은 폴더 먼저·숫자 인식 가나다순.

### 7.3 글 목록 (PR 2)

- 대상: `.page-listing` — `/notes/` 폴더 페이지, `/tags/<태그>`, `/tags/` 색인. 첫 화면 `.recent-li`와 같은 `note-row` mixin을 쓴다.
- `.section-li > .section`은 grid 대신 **flex column + `order`**로 제목(1) → 날짜(2) → 태그(3) 순서를 만든다. 팝오버의 `grid-template-columns !important`와 충돌하지 않기 위해서다.
- 날짜는 `white-space: nowrap`, 제목은 `word-break: keep-all` + `overflow-wrap: anywhere`.
- 모바일(≤600px)에서도 태그 칩을 표시한다(플러그인 기본값은 숨김).
- 행 hover / `:focus-within`: 배경 `var(--highlight)`, 좌우 padding 0.75rem (PR 3에서 `note-row` mixin으로 옮겨 첫 화면 최근 노트에도 적용).
- "N건의 항목" 카운트는 보조 텍스트 색 0.85rem. `/tags/` 색인은 태그 그룹 사이 2rem.

### 7.4 모바일 헤더 · 전역 타이포그래피 (PR 3)

- 모바일(≤800px) 헤더: `.sidebar.left` gap 0.25rem. 사이트 제목 `.page-title`은 `flex: 1 1 auto; min-width: 0`, 1.25rem, 링크는 `nowrap` + `ellipsis`(base.scss의 `overflow-wrap: anywhere`를 `normal`로 해제). 데스크톱 제목 크기는 그대로.
- 모바일 검색 버튼: "검색" 글자를 숨긴 2rem 아이콘 버튼. 접근성 이름은 버튼의 `aria-label="검색"`.
- 전역 줄바꿈 규칙은 §3 참고.

### 7.5 글 머리 (PR 6)

- 시각 순서: 브레드크럼 → 글 제목(h1) → 메타 줄(날짜 · 읽기 시간) → 요약(description) → 태그 칩 → 구분선 → 본문. 마크업 순서(브레드크럼, 제목, 속성, 메타)는 그대로 두고 `.page-header > .popover-hint`의 flex `order`로 바꾼다.
- 브레드크럼: 0.85rem. 마지막 항목(현재 페이지)과 그 앞 구분자는 숨긴다(h1과 중복). 항목이 하나뿐이면 그대로 둔다.
- 메타 줄: 보조 텍스트 색, 0.88rem, 구분자는 가운뎃점(`·`).
- note-properties: 접기 헤더·키 열·테두리를 숨기고 요약은 리드 문단(`--dark`, 1.02rem, 행간 1.7, 왼쪽 선 없음 — 본문 첫 인용문과 구분), 태그는 공통 칩(§7.1). 저장된 접힘 상태 대비 `::details-content { content-visibility: visible }`.
- 속성이 있는 글은 글 머리 아래 `1px solid var(--lightgray)` 구분선 + padding-bottom 1.25rem.

### 7.6 본문 가독성 (PR 7)

모두 `article` 범위. base.scss는 그대로 두고 custom.scss에서 덮어쓴다.

| 요소         | 규칙                                                                                                                                                                                                                                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 본문 첫 요소 | 글 머리 구분선 아래 margin-top 1.25rem                                                                                                                                                                                                                                                                                |
| 소제목       | h2 위 2.5rem(모바일 2rem)·아래 .75rem, h3 위 1.75rem·아래 .5rem                                                                                                                                                                                                                                                       |
| 인용문       | 테두리 `color-mix(--secondary 55%)`, 글자 `--darkgray`                                                                                                                                                                                                                                                                |
| 표           | `.table-container`에 1px lightgray 테두리·radius 8px(들여쓰기 없음), table 100%, 0.92rem(모바일 .86rem), 셀 padding .55rem .8rem·위 정렬·행간 1.55, th 배경 `color-mix(--lightgray 45%)`·semibold·nowrap, 행 hover. 모바일 td `overflow-wrap: anywhere`(긴 경로 때문). 그래도 넘치는 표는 컨테이너 안에서 가로 스크롤 |
| 코드 블록    | 배경 `color-mix(--lightgray 30%, --light)`, radius 8px, .84rem(모바일 .8rem)·행간 1.65. 언어 라벨·복사 버튼은 PR 8에서 `figure` 기준 `.code-actions`로 옮김(§7.7)                                                                                                                                                     |
| 인라인 코드  | 배경 `color-mix(--lightgray 60%)`, padding .08rem .35rem                                                                                                                                                                                                                                                              |
| 콜아웃       | radius 8px (카드와 통일)                                                                                                                                                                                                                                                                                              |

### 7.7 코드 복사 버튼 · 이전/다음 글 (PR 8, `plugins/post-extras`)

- **코드 액션 바** `.code-actions`: 스크립트가 `nav`·`render` 때마다 `article figure[data-rehype-pretty-code-figure]`에 한 번만 붙인다. `figure` 기준 absolute(오른쪽 위)라서 `pre`를 가로로 스크롤해도 고정된다. 언어 라벨 `.code-lang`(plaintext·txt·text 제외, 있으면 `figure.has-code-lang`) + 버튼 `.code-copy`("복사" → "복사됨"/"실패" 1.6초, `aria-label="코드 복사"`). 라벨 있는 블록은 code 위 padding 1.9rem.
- 복사 텍스트는 `[data-line]` 줄들의 텍스트를 줄바꿈으로 합친다(줄 번호 제외). clipboard API가 없으면 `textarea` + `execCommand` 폴백.
- **이전/다음 글** `.post-nav`: 같은 폴더(범주) 글만, `index`·태그 제외, `frontmatter.date` 오름차순(같으면 슬러그 숫자 인식 비교). 카드 2열(이전 왼쪽 · 다음 오른쪽 정렬, 이전이 없으면 빈 칸으로 다음을 오른쪽에 유지), 모바일 1열. 카드 테두리·hover는 §7.1 카드 규칙.

### 7.8 한국어 UI 문자열 (PR 9)

커뮤니티 플러그인의 ko-KR 번역이 영문으로 남아 있는 것은 node_modules를 고치지 않고 로컬 플러그인·옵션으로 바꾼다.

| 영문                                                               | 한국어                                   | 방법                                                                                                                |
| ------------------------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `21 min read`                                                      | `약 12분`                                | content-meta 끄고 `plugins/post-meta`(같은 `p.content-meta` 마크업). 한글 분당 500자 + 영문 단어 분당 200단어       |
| `Created with Quartz v5.2.2 © 2026`                                | `© 2026 P-digit · Quartz로 만들었습니다` | footer 끄고 `plugins/site-footer`. `footer.site-footer`: 위 1px lightgray 선, 보조 텍스트색 0.85rem, 링크 가로 나열 |
| `Home` (브레드크럼)                                                | `홈`                                     | breadcrumbs `rootName` 옵션                                                                                         |
| 검색 아이콘 툴팁 `Search`, aria-label `Global Graph`·`breadcrumbs` | `검색`, `전체 그래프`·`현재 위치`        | `plugins/post-extras` inline 스크립트(nav·render 때 교체)                                                           |

- 복사 버튼 `.code-copy`: `min-width: 4.8em` 가운데 정렬(문구가 바뀌어도 폭 고정), 실패 상태는 점선 테두리 + `--dark`(빨강 토큰 없음).
- 태그 표시 이름(PR 10): Quartz는 태그를 소문자 슬러그(`#isaac-sim`)로 보여 준다. 노션 동기화가 `.notion-sync/tag-labels.json`(슬러그 → 노션 원래 이름, 슬러그와 이름이 다른 것만)을 만들고, `plugins/post-extras`가 빌드 때 읽어 넣은 스크립트로 `a.tag-link` 글자와 태그 페이지 제목·탭 제목만 원래 이름(`#Isaac Sim`)으로 바꾼다. 링크 주소는 슬러그 그대로.

### 7.9 첫 화면 태그 칩 · 푸터 링크 (PR 11)

- **태그 칩** `nav.home-tags`(`plugins/home-tags`, afterBody priority 3, `is-index`): 글 페이지의 태그를 세어 많이 쓰인 순(동률은 이름 가나다순), 최대 12개 + "전체 태그 →". 이름은 `.notion-sync/tag-labels.json`(빌드 때 읽음, 깜빡임 없음). 손으로 관리하던 칩은 없앴다.
- 글 수 배지 `.home-tag__count`: 이름 끝 숫자("ROS 2")와 헷갈리지 않게 작은 둥근 배지(배경 `--light`, 글자 `color-mix(--secondary 75%)`, .72rem, 숫자 폭 고정). 칩 padding .3rem .6rem, gap .4rem.
- **푸터 링크**: 외부 링크는 `target="_blank" rel="noopener noreferrer"` + `aria-label="… (새 탭)"`. 색은 푸터 글자색(`p`·`li`도 inherit로 base의 `--darkgray` 해제) + semibold, hover·focus 때만 `--secondary` + 밑줄.

### 7.10 내비게이션 (PR 13)

| 요소                                   | 규칙                                                                                                                                                                                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 사이트 제목                            | weight 800, 글자 `--dark`(hover `--secondary`)                                                                                                                                                                                                                      |
| 사이드바 소제목(탐색기·그래프 뷰·목차) | 0.78rem semibold, 보조 텍스트색, 자간 .02em                                                                                                                                                                                                                         |
| 툴바 컨트롤                            | 높이 2.1rem(`$control-h`), radius `--radius-surface`. 검색 상자: 1px lightgray 테두리 + `color-mix(--lightgray 22%)` 배경, hover·focus 때 테두리 `color-mix(--secondary 45%)`. 다크/리더 버튼: 2.1rem 정사각, hover `--highlight`. 모바일 검색 버튼도 2.1rem 정사각 |
| 탐색기                                 | 항목 0.9rem, padding .2rem .5rem, radius 6px, 기본 `--darkgray`. hover `color-mix(--lightgray 45%)`. 현재 글 `.active` = `--highlight` 배경 + `--secondary` semibold 알약                                                                                           |
| 목차                                   | 항목 왼쪽 2px lightgray 선, 0.86rem. 지나온 제목 `--darkgray`, **지금 읽는 위치**(in-view가 붙은 마지막 항목) = 왼쪽 선·글자 `--secondary` semibold                                                                                                                 |
| 그래프 상자                            | 1px lightgray, radius 8px, 배경 `color-mix(--lightgray 15%)`                                                                                                                                                                                                        |
| 모바일 헤더                            | 아래 1px lightgray 구분선, padding-bottom .75rem                                                                                                                                                                                                                    |

### 7.11 카드 · 칩 · 목록 행 (PR 14)

- **`@mixin chip`** (태그 칩 공통): padding .12rem .5rem, 1px `color-mix(--secondary 18%)` 테두리, radius `--radius-chip`(6px), 배경 `--highlight`, 글자 `--secondary` .78rem 500, `#` 접두 opacity .55. hover·focus: 테두리 `color-mix(--secondary 55%)`, 배경 `color-mix(--secondary 12%, --light)`. 적용: 글 목록·최근 글(`a.tag-link`), 글 상단(`a.note-properties-tag`), 첫 화면(`a.home-tag`, 한 단계 크게 .28rem .6rem .85rem). 글 수 배지 radius 4px, "연재 중" 배지 `--radius-chip`.
- **`@mixin lift-card`** (링크 카드 공통): 1px lightgray, radius `--radius-card`(10px), `--shadow-sm`. hover·focus: `translateY(-2px)` + 테두리 `color-mix(--secondary 45%, --lightgray)` + `--shadow-md`. `prefers-reduced-motion`이면 움직이지 않음. 적용: 첫 화면 범주 카드, 이전/다음 글 카드(hover 때 제목 `--secondary`).
- **목록 행 `note-row`**: 제목 1.02rem semibold `--dark`, 행 hover·focus-within 때 배경 `color-mix(--lightgray 35%)`(칩의 파란 배경과 겹치지 않는 중립색) + 제목 `--secondary`, 날짜 `tabular-nums`.
- 모바일 ☰(탐색기) 버튼: 2.1rem 정사각, radius 8px, hover `--highlight` — 오른쪽 툴바와 대칭.

### 7.12 첫 화면 hero · 범주 카드 비주얼 (PR 15)

- **h1 숨김**: 첫 화면 h1은 사이드바·모바일 헤더의 사이트 제목과 같아서 visually-hidden(1px, `clip-path: inset(50%)`). 화면 읽기 프로그램·검색엔진에는 남는다. hero 문장이 시각적 제목.
- **hero**: 1px `color-mix(--secondary 16%, --lightgray)` 테두리, radius 14px, `--shadow-sm`. 배경 = 왼쪽 위 radial `color-mix(--secondary 9%)` + 오른쪽 아래 radial `color-mix(--tertiary 8%)` + `--light`. `::before` 점 격자(1px 점, 14px 간격, `color-mix(--secondary 22%)`)를 `mask-image`로 오른쪽 위에서만 보이게(`isolation: isolate`, `z-index: -1`).
- **hero 글자**: 배지 = `--radius-chip` + 1px 테두리 + 틸 상태 점(0.42rem, 3px 링). lead 1.5rem 700 자간 -0.025em, 최대 30em(모바일 1.22rem). sub 행간 1.7, 최대 36em.
- **범주 카드 아이콘**: 이모지를 2.5rem 사각 칸(radius 8px, `color-mix(--lightgray 45%)`)에 담는다. 카드 hover 때 칸 `--highlight`. 연재 중 카드는 3rem 칸 `color-mix(--secondary 10%)`.
- **목록 행 hover**(이슈 24): hover 행과 바로 위 행의 구분선을 숨기고 hover 때만 radius `--radius-surface` → 선에 닿지 않는 둥근 면. 평소 구분선은 직선.

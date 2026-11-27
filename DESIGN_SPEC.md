# DESIGN_SPEC — p-digit.github.io

> 디자인 및 구조 명세. 모든 UI 작업은 이 문서의 토큰·규칙을 따르고, 바뀐 규칙은 작업 PR에서 함께 갱신한다.
> 기준 버전: Quartz v5.2.2 · 최종 갱신 2026-11-27

## 1. 사이트 성격

- **이름:** P-digit 개발 기록 (`pageTitle`) / 첫 화면 제목 "로보틱스 학습 기록"(범주 허브 PR에서 바꿀 예정)
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

## 2. 컬러 팔레트 (`quartz.config.yaml > theme.colors`)

Quartz는 아래 토큰을 CSS 변수(`var(--light)` 등)로 노출한다. 새 색을 하드코딩하지 말고 토큰이나 `color-mix()`로 파생한다.

| 토큰              | 용도                                | Light                   | Dark        |
| ----------------- | ----------------------------------- | ----------------------- | ----------- |
| `--light`         | 페이지 배경                         | `#faf8f8`               | `#161618`   |
| `--lightgray`     | 테두리·구분선·카드 배경             | `#e5e5e5`               | `#393639`   |
| `--gray`          | 보조 텍스트(날짜·메타), 그래프 노드 | `#b8b8b8`               | `#646464`   |
| `--darkgray`      | 본문 텍스트                         | `#4e4e4e`               | `#d4d4d4`   |
| `--dark`          | 제목·강조 텍스트                    | `#2b2b2b`               | `#ebebec`   |
| `--secondary`     | 링크·사이트 제목·포인트 색          | `#284b63`               | `#7b97aa`   |
| `--tertiary`      | hover·선택 상태                     | `#84a59d`               | `#84a59d`   |
| `--highlight`     | 내부 링크·태그 배경                 | `rgba(143,159,169,.15)` | 같음        |
| `--textHighlight` | `==형광펜==`                        | `#fff23688`             | `#b3aa0288` |

- 다크 모드: `@quartz-community/darkmode` 토글이 `html[saved-theme="dark"]`를 바꾼다. 커스텀 스타일은 변수만 쓰면 양쪽 모드가 자동으로 맞는다.
- 코드 하이라이트: Shiki `github-light` / `github-dark`, `keepBackground: false`

## 3. 타이포그래피

| 역할                  | 글꼴          | 비고         |
| --------------------- | ------------- | ------------ |
| 헤더 (`--headerFont`) | Noto Sans KR  | Google Fonts |
| 본문 (`--bodyFont`)   | Noto Sans KR  |              |
| 코드 (`--codeFont`)   | IBM Plex Mono |              |

- 제목 크기(base.scss): h1 1.75rem(글 제목 `article > h1` 2rem), h2 1.4rem, h3 1.12rem, h4~h6 1rem
- 굵기: 본문 400, 링크·`strong` 600, 제목 700
- 한국어 장문 규칙(PR 3에서 전역 적용): `body { word-break: keep-all; overflow-wrap: break-word }`. 어절 단위로 줄바꿈하고, 긴 영문·경로는 `break-word`로 넘침만 막는다. `anywhere`는 표 칸의 최소 폭까지 줄여 표가 찌그러지므로 본문에는 쓰지 않는다. `pre`, `code`는 `word-break: normal`.

## 4. 레이아웃 구조

브레이크포인트(`quartz/styles/variables.scss`): **mobile ≤ 800px**, tablet 800–1200px, **desktop ≥ 1200px**. 사이드 패널 폭 320px, 최대 페이지 폭 1500px.

| 영역            | Desktop                                                               | Mobile                                               |
| --------------- | --------------------------------------------------------------------- | ---------------------------------------------------- |
| 왼쪽 사이드바   | 사이트 제목 → [검색 · 다크모드 · 리더모드] 툴바 → 탐색기              | 상단 가로 헤더 (☰ + 제목 한 줄 + 아이콘 툴바, 69px) |
| beforeBody      | 브레드크럼(홈 제외) → 글 제목 → 노트 속성(Properties) → 날짜·읽기시간 | 같음                                                 |
| 본문            | `article`                                                             | 같음                                                 |
| 오른쪽 사이드바 | 그래프 뷰 → 목차(TOC) → 백링크                                        | 본문 아래로 내려감                                   |
| footer          | "Created with Quartz" + GitHub 링크                                   | 같음                                                 |

페이지 유형별 차이(`layout.byPageType`): 폴더·태그 페이지는 오른쪽 사이드바 없음, 리더 모드 버튼 제외.

## 5. 주요 컴포넌트

| 컴포넌트                 | 플러그인                                  | 위치                                         | 비고                                      |
| ------------------------ | ----------------------------------------- | -------------------------------------------- | ----------------------------------------- |
| 사이트 제목              | page-title                                | left                                         |                                           |
| 검색                     | search                                    | left/toolbar                                 | 전체 텍스트 검색 + 미리보기               |
| 다크모드 / 리더모드      | darkmode / reader-mode                    | left/toolbar                                 |                                           |
| 탐색기                   | explorer                                  | left                                         | 폴더 `notes`                              |
| 브레드크럼               | breadcrumbs                               | beforeBody                                   | 홈 제외                                   |
| 글 제목·메타             | article-title / content-meta              | beforeBody                                   | 날짜 + 읽기 시간                          |
| 노트 속성                | note-properties                           | beforeBody                                   | description·tags 표시 (aliases는 숨김)    |
| 그래프 / 목차 / 백링크   | graph / table-of-contents / backlinks     | right                                        |                                           |
| 글 목록                  | folder-page / tag-page                    | 본문                                         | 제목 → 날짜 → 태그 칩 세로 스택 (PR 2)    |
| 최근 글                  | recent-notes                              | afterBody (`condition: is-index`, 첫 화면만) | 전 범주 5개, 제목 · 날짜 · 태그 칩        |
| 홈 hero / 카드 / 태그 칩 | `content/index.md` 마크업 + `custom.scss` | 첫 화면 본문                                 | `.home-hero`, `.home-cards`, `.home-tags` |
| 콜아웃                   | obsidian-flavored-markdown                | 본문                                         | 노션 토글 → 접히는 콜아웃                 |

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

### 7.2 첫 화면 (PR 1)

- 순서: 글 제목(h1, 유일) → hero(뱃지 + lead + sub) → 바로가기 카드 3개 → 주제별 태그 칩 → 최근 학습 노트
- 첫 화면에서는 `.content-meta`(수정일·읽기 시간)를 숨긴다 (`body[data-slug="index"]`).
- 카드 그리드: desktop 3열, tablet·mobile 1열. 마크업 링크는 Quartz 실제 슬러그(소문자, 상대경로 `./tags/ros-2`)와 `class="internal"`을 쓴다.
- 레이아웃 조건 `is-index`는 `quartz.ts`에서 `registerCondition`으로 등록한다.

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

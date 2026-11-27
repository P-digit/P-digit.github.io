# DESIGN_SPEC — p-digit.github.io

> 디자인 및 구조 명세. 모든 UI 작업은 이 문서의 토큰·규칙을 따르고, 바뀐 규칙은 작업 PR에서 함께 갱신한다.
> 기준 버전: Quartz v5.2.2 · 최종 갱신 2026-11-27

## 1. 사이트 성격

- **이름:** P-digit 개발 기록 (`pageTitle`) / 첫 화면 제목 "로보틱스 학습 기록"
- **내용:** NVIDIA AI Campus 로보틱스 과정(Isaac Sim · ROS 2 · Isaac Lab) 일차별 학습 노트. 한국어 장문 + 표 + 코드 블록이 많다.
- **독자 경험 목표:** 일차 순서대로 따라 읽기 쉽고, 태그(주제)로 되찾기 쉬우며, 긴 글을 모바일에서도 편하게 읽는 것.

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
- 한국어 장문 규칙: `word-break: keep-all` 사용을 권장(단어 중간 줄바꿈 방지). 대신 긴 영문/경로는 `overflow-wrap: anywhere`로 넘침을 막는다.

## 4. 레이아웃 구조

브레이크포인트(`quartz/styles/variables.scss`): **mobile ≤ 800px**, tablet 800–1200px, **desktop ≥ 1200px**. 사이드 패널 폭 320px, 최대 페이지 폭 1500px.

| 영역            | Desktop                                                               | Mobile                                       |
| --------------- | --------------------------------------------------------------------- | -------------------------------------------- |
| 왼쪽 사이드바   | 사이트 제목 → [검색 · 다크모드 · 리더모드] 툴바 → 탐색기              | 상단 가로 헤더 (햄버거 탐색기 + 제목 + 툴바) |
| beforeBody      | 브레드크럼(홈 제외) → 글 제목 → 노트 속성(Properties) → 날짜·읽기시간 | 같음                                         |
| 본문            | `article`                                                             | 같음                                         |
| 오른쪽 사이드바 | 그래프 뷰 → 목차(TOC) → 백링크                                        | 본문 아래로 내려감                           |
| footer          | "Created with Quartz" + GitHub 링크                                   | 같음                                         |

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
| 노트 속성                | note-properties                           | beforeBody                                   | description·tags·aliases 표시             |
| 그래프 / 목차 / 백링크   | graph / table-of-contents / backlinks     | right                                        |                                           |
| 글 목록                  | folder-page / tag-page                    | 본문                                         | 날짜 · 제목 · 태그 3열                    |
| 최근 학습 노트           | recent-notes                              | afterBody (`condition: is-index`, 첫 화면만) | 5개, 제목 · 날짜 · 태그 칩                |
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

| 요소                   | 규칙                                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 카드                   | `1px solid var(--lightgray)`, radius 10px, 배경 `var(--light)`. hover/focus: `translateY(-2px)` + 테두리 `var(--secondary)` + 그림자 `color-mix(--dark 8%)`, 0.15s |
| 강조 패널(hero)        | radius 12px, 왼쪽 4px `var(--secondary)` 보더, 배경 `color-mix(in srgb, var(--secondary) 5%, var(--light))`                                                        |
| 칩(태그·뱃지)          | radius 999px, 배경 `var(--highlight)`, 글자 `var(--secondary)`, `#` 접두는 opacity .6, hover 시 테두리 secondary. 보조 칩은 투명 배경 + lightgray 테두리           |
| 보조 텍스트(날짜·라벨) | `--gray`는 라이트 모드 대비가 낮아 텍스트에 쓰지 않는다 → `color-mix(in srgb, var(--darkgray) 75%, var(--light))`                                                  |
| 링크형 블록            | `text-decoration: none` 명시, 진입 화살표 `→`(기본 `--gray`, hover `--secondary` + `translateX(3px)`)                                                              |
| 리스트 행              | 위아래 `1px solid var(--lightgray)` 구분선, 행 padding 0.85rem 0                                                                                                   |

### 7.2 첫 화면 (PR 1)

- 순서: 글 제목(h1, 유일) → hero(뱃지 + lead + sub) → 바로가기 카드 3개 → 주제별 태그 칩 → 최근 학습 노트
- 첫 화면에서는 `.content-meta`(수정일·읽기 시간)를 숨긴다 (`body[data-slug="index"]`).
- 카드 그리드: desktop 3열, tablet·mobile 1열. 마크업 링크는 Quartz 실제 슬러그(소문자, 상대경로 `./tags/ros-2`)와 `class="internal"`을 쓴다.
- 레이아웃 조건 `is-index`는 `quartz.ts`에서 `registerCondition`으로 등록한다.

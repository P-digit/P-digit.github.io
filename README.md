# P-digit 개발 기록

로봇, 알고리즘, 임베디드 등 공부하고 만들며 배운 것을 노션에 정리하고, [Quartz v5](https://quartz.jzhao.xyz)로 공개하는 개인 개발 블로그 저장소입니다.

- 사이트: https://p-digit.github.io/
- 노션 '학습 기록' DB에서 **공개** 체크한 글만 자동으로 올라오고, **카테고리**에 따라 범주 폴더로 나뉩니다.

```
노션에서 [공개] 체크 + [카테고리] 선택
   ↓  (3시간마다, 또는 Actions에서 바로 실행)
GitHub Actions: scripts/notion-sync.mjs → content/<범주>/*.md 커밋
   ↓
Quartz 빌드 → GitHub Pages 배포
```

## 범주

| 범주     | 주소          | 노션 `카테고리` | 내용                                                                         |
| -------- | ------------- | --------------- | ---------------------------------------------------------------------------- |
| 로보틱스 | `/robotics/`  | 로보틱스        | NVIDIA AI Campus 로보틱스 과정(Isaac Sim · ROS 2 · Isaac Lab) 일차별 노트 등 |
| 알고리즘 | `/algorithm/` | 알고리즘        | 문제 풀이 · 자료구조                                                         |
| 임베디드 | `/embedded/`  | 임베디드        | MCU · 펌웨어 · 센서 · 통신                                                   |
| 개발     | `/dev/`       | 개발            | 웹 · 도구 · 환경 설정 등 그 밖의 개발 글                                     |
| 회고     | `/retro/`     | 회고            | 돌아보기 · 생각 정리                                                         |

- `카테고리`를 비워 두면 `일차`·`강의명`이 있는 강의 노트는 **로보틱스**, 나머지는 **개발**로 올라갑니다.
- 범주를 넘나드는 주제는 노션 `키워드`·`세션`(→ 블로그 태그)으로 묶습니다.

## 처음 한 번 설정

### 1. 노션 통합(API 토큰)

1. https://www.notion.so/profile/integrations → **새 통합** → 유형 _내부_
2. 기능은 **콘텐츠 읽기**만 켜기
3. **내부 통합 시크릿**(`ntn_...`) 복사
4. '학습 기록' DB가 들어 있는 노션 페이지(지금은 `NVIDIA AI Campus 로보틱스 학습`) → `•••` → **연결** → 방금 만든 통합 추가
   - DB를 다른 페이지로 옮기면 새 위치에서도 통합이 연결돼 있는지 확인합니다. DB ID는 바뀌지 않습니다.

### 2. GitHub 저장소 설정

- **Settings → Secrets and variables → Actions → New repository secret**
  - `NOTION_TOKEN` = 위에서 복사한 시크릿
  - `NOTION_DATABASE_ID` = `42047b7cc0d48162b6d7e753f7e38bdd`
- **Settings → Pages → Build and deployment → Source** = **GitHub Actions**

### 3. 첫 배포

노션에서 글 하나에 **공개** 체크 → **Actions** 탭 → _노션 동기화 → Quartz 배포_ → **Run workflow** → 2~3분 뒤 사이트 확인.

시크릿이 없으면 노션 동기화는 건너뛰고 블로그만 빌드합니다.

## 평소 사용법

- 노션에서 쓰고 **카테고리** 선택 + **공개** 체크 → 3시간 안에 반영. 바로 올리려면 Actions에서 _Run workflow_.
- 공개 체크를 끄면 다음 동기화 때 블로그에서도 내려갑니다(스크립트가 만든 글만 지움).
- 주소는 `/<범주>/<슬러그>`. 바꾸고 싶으면 노션 **슬러그**에 영문을 적습니다. 비우면 `날짜-제목`.
- 카테고리나 슬러그를 바꿔 주소가 달라지면, 옛 주소는 새 주소로 자동 리다이렉트됩니다(옛 경로를 `aliases`로 남김). 예전 `/notes/…` 주소도 `/robotics/…`로 넘어갑니다.
- 노션 이미지는 만료되는 주소라 `content/attachments/notion/`에 내려받아 커밋합니다.
- 노션 토글은 접히는 콜아웃으로, `Q1.`로 시작하는 토글은 질문 콜아웃으로 바뀝니다.

## 파일 구성

| 파일                             | 역할                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `quartz.config.yaml`             | 사이트 설정 (제목, `ko-KR`, `baseUrl: p-digit.github.io`, Noto Sans KR 글꼴)                              |
| `scripts/notion-sync.mjs`        | 노션 → 마크다운 변환 (추가 패키지 없음). 노션 속성 이름이 바뀌면 위쪽 `PROPS`, 범주는 `CATEGORIES`만 수정 |
| `.notion-sync/manifest.json`     | 동기화 기록 (노션 페이지 ↔ 파일, 옛 주소 aliases)                                                         |
| `.github/workflows/deploy.yml`   | 동기화 + 빌드 + 배포                                                                                      |
| `content/index.md`               | 첫 화면 (소개 · 범주 카드 · 태그 칩 · 최근 글) — 손으로 관리                                              |
| `content/<범주>/index.md`        | 범주 소개 페이지 — 손으로 관리                                                                            |
| `content/<범주>/*.md`            | 노션에서 동기화된 글 — **직접 고치지 말 것**(다음 동기화가 덮어씀)                                        |
| `plugins/post-extras/`           | 블로그 전용 로컬 플러그인: 코드 복사 버튼 + 같은 범주 이전/다음 글. 빌드 없는 JS를 `dist/`에 직접 작성    |
| `quartz/styles/custom.scss`      | 블로그 커스텀 스타일 (Quartz 기본 스타일 파일은 건드리지 않음)                                            |
| `DESIGN_SPEC.md` · `PROGRESS.md` | 디자인 규칙 · 진행 현황과 백로그                                                                          |

### 범주 추가하기

1. 노션 `카테고리` 속성에 선택지 추가
2. `scripts/notion-sync.mjs`의 `CATEGORIES`에 `"선택지 이름": "폴더"` 추가
3. `content/<폴더>/index.md` 만들기 (`title` + 소개 한두 문장)
4. 첫 화면 `content/index.md`에 범주 카드, `quartz.config.yaml` 탐색기 `sortFn`의 순서 배열에 폴더 추가

## 내 PC에서 미리 보기 (Node 22.22 이상)

```bash
npm ci
npx quartz plugin install
export NOTION_TOKEN=ntn_...
export NOTION_DATABASE_ID=42047b7cc0d48162b6d7e753f7e38bdd
node scripts/notion-sync.mjs
npx quartz build --serve      # http://localhost:8080
npx prettier --check quartz/styles quartz.config.yaml   # 스타일·설정 포맷 검사
```

## 문제 해결

| 증상                                  | 해결                                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------- |
| `Notion API ... 404 object_not_found` | 노션 페이지에 통합을 연결하지 않았거나 DB ID가 틀림                                         |
| `Notion API ... 400` (공개 속성)      | DB에 `공개` 체크박스가 없음. 이름이 다르면 워크플로에 `PUBLISH_PROPERTY` 지정               |
| 동기화 로그에 `모르는 카테고리 "…"`   | 노션에 새 선택지를 만들고 `CATEGORIES`에 안 넣음 → 글은 `dev`로 감. 위 '범주 추가하기' 참고 |
| 글이 엉뚱한 범주에 올라감             | 노션 `카테고리`가 비어 있음(강의 노트면 로보틱스, 아니면 개발로 감) → 카테고리 지정         |
| 커밋 단계 `git push` 403              | Settings → Actions → General → Workflow permissions를 Read and write로                      |
| `github-pages` 환경 보호 규칙 오류    | Settings → Environments에서 기존 github-pages 환경 삭제 후 다시 실행                        |

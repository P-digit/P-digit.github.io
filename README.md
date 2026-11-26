# 로보틱스 학습 기록 블로그

NVIDIA AI Campus 로보틱스 과정을 공부하며 노션에 정리한 기록을 [Quartz v5](https://quartz.jzhao.xyz)로 공개하는 저장소입니다.

- 사이트: https://p-digit.github.io/
- 노션 '학습 기록' DB에서 **공개** 체크한 글만 자동으로 올라옵니다.

```
노션에서 [공개] 체크
   ↓  (3시간마다, 또는 Actions에서 바로 실행)
GitHub Actions: scripts/notion-sync.mjs → content/notes/*.md 커밋
   ↓
Quartz 빌드 → GitHub Pages 배포
```

## 처음 한 번 설정

### 1. 노션 통합(API 토큰)

1. https://www.notion.so/profile/integrations → **새 통합** → 유형 *내부*
2. 기능은 **콘텐츠 읽기**만 켜기
3. **내부 통합 시크릿**(`ntn_...`) 복사
4. 노션 `NVIDIA AI Campus 로보틱스 학습` 페이지 → `•••` → **연결** → 방금 만든 통합 추가

### 2. GitHub 저장소 설정

- **Settings → Secrets and variables → Actions → New repository secret**
  - `NOTION_TOKEN` = 위에서 복사한 시크릿
  - `NOTION_DATABASE_ID` = `42047b7cc0d48162b6d7e753f7e38bdd`
- **Settings → Pages → Build and deployment → Source** = **GitHub Actions**

### 3. 첫 배포

노션에서 글 하나에 **공개** 체크 → **Actions** 탭 → *노션 동기화 → Quartz 배포* → **Run workflow** → 2~3분 뒤 사이트 확인.

시크릿이 없으면 노션 동기화는 건너뛰고 블로그만 빌드합니다.

## 평소 사용법

- 노션에서 쓰고 **공개** 체크 → 3시간 안에 반영. 바로 올리려면 Actions에서 *Run workflow*.
- 공개 체크를 끄면 다음 동기화 때 블로그에서도 내려갑니다(스크립트가 만든 글만 지움).
- 주소를 바꾸고 싶으면 노션 **슬러그**에 영문을 적습니다. 비우면 `날짜-제목`.
- 노션 이미지는 만료되는 주소라 `content/attachments/notion/`에 내려받아 커밋합니다.
- 노션 토글은 접히는 콜아웃으로, `Q1.`로 시작하는 토글은 질문 콜아웃으로 바뀝니다.

## 파일 구성

| 파일 | 역할 |
| --- | --- |
| `quartz.config.yaml` | 사이트 설정 (제목, `ko-KR`, `baseUrl: p-digit.github.io`, Noto Sans KR 글꼴) |
| `scripts/notion-sync.mjs` | 노션 → 마크다운 변환 (추가 패키지 없음). 노션 속성 이름이 바뀌면 위쪽 `PROPS`만 수정 |
| `.github/workflows/deploy.yml` | 동기화 + 빌드 + 배포 |
| `content/index.md` | 첫 화면 |

## 내 PC에서 미리 보기 (Node 22.22 이상)

```bash
npm ci
npx quartz plugin install
export NOTION_TOKEN=ntn_...
export NOTION_DATABASE_ID=42047b7cc0d48162b6d7e753f7e38bdd
node scripts/notion-sync.mjs
npx quartz build --serve      # http://localhost:8080
```

## 문제 해결

| 증상 | 해결 |
| --- | --- |
| `Notion API ... 404 object_not_found` | 노션 페이지에 통합을 연결하지 않았거나 DB ID가 틀림 |
| `Notion API ... 400` (공개 속성) | DB에 `공개` 체크박스가 없음. 이름이 다르면 워크플로에 `PUBLISH_PROPERTY` 지정 |
| 커밋 단계 `git push` 403 | Settings → Actions → General → Workflow permissions를 Read and write로 |
| `github-pages` 환경 보호 규칙 오류 | Settings → Environments에서 기존 github-pages 환경 삭제 후 다시 실행 |

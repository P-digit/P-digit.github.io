import { readFileSync } from "node:fs"
import path from "node:path"

// P-digit 블로그 전용 로컬 플러그인 (빌드 단계 없는 플레인 ESM)
// - transformer: 코드 블록 복사 버튼 · 영문 UI 라벨 한국어화 · 태그 표시 이름 스크립트를 모든 페이지에 넣는다
// - component: PostNav (dist/components/index.js)
// 스타일은 quartz/styles/custom.scss 에 있다 (.code-actions, .post-nav)

// 브라우저에서 실행되는 스크립트. SPA 이동마다 "nav" 이벤트가 오고,
// 복호화 등으로 본문이 바뀌면 "render" 가 온다 → 두 번 돌아도 안전하게 만든다.
const copyScript = `
(() => {
  const LABEL = "복사"
  const DONE = "복사됨"
  const FAIL = "실패"
  const SKIP_LANGS = new Set(["plaintext", "txt", "text"])

  function codeText(pre) {
    const code = pre.querySelector(":scope > code")
    if (!code) return pre.textContent ?? ""
    const lines = code.querySelectorAll(":scope > [data-line]")
    if (lines.length === 0) return code.textContent ?? ""
    return Array.from(lines, (l) => l.textContent ?? "").join("\\n")
  }

  async function writeClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return
    }
    // http 미리보기 등 clipboard API가 없는 환경
    const ta = document.createElement("textarea")
    ta.value = text
    ta.setAttribute("readonly", "")
    ta.style.position = "fixed"
    ta.style.opacity = "0"
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand("copy")
    ta.remove()
    if (!ok) throw new Error("copy failed")
  }

  function setup() {
    const figures = document.querySelectorAll("article figure[data-rehype-pretty-code-figure]")
    for (const fig of figures) {
      const pre = fig.querySelector(":scope > pre")
      if (!pre || pre.querySelector(":scope > code.mermaid")) continue
      if (fig.querySelector(":scope > .code-actions")) continue

      const bar = document.createElement("div")
      bar.className = "code-actions"

      const lang = pre.getAttribute("data-language")
      if (lang && !SKIP_LANGS.has(lang)) {
        const label = document.createElement("span")
        label.className = "code-lang"
        label.textContent = lang
        bar.appendChild(label)
        fig.classList.add("has-code-lang")
      }

      const btn = document.createElement("button")
      btn.type = "button"
      btn.className = "code-copy"
      btn.textContent = LABEL
      btn.setAttribute("aria-label", "코드 복사")
      let timer
      const onClick = async () => {
        try {
          await writeClipboard(codeText(pre))
          btn.textContent = DONE
          btn.dataset.state = "done"
        } catch {
          btn.textContent = FAIL
          btn.dataset.state = "fail"
        }
        clearTimeout(timer)
        timer = setTimeout(() => {
          btn.textContent = LABEL
          delete btn.dataset.state
        }, 1600)
      }
      btn.addEventListener("click", onClick)
      window.addCleanup?.(() => btn.removeEventListener("click", onClick))
      bar.appendChild(btn)

      fig.appendChild(bar)
    }
  }

  document.addEventListener("nav", setup)
  document.addEventListener("render", setup)
})()
`

// 플러그인 컴포넌트에 박혀 있는 영문 접근성 라벨·툴팁을 한국어로 (ko-KR 번역이 비어 있는 것들)
const uiLabelScript = `
(() => {
  const fixes = [
    [".search-button svg > title", (el) => (el.textContent = "검색")],
    [".global-graph-icon", (el) => el.setAttribute("aria-label", "전체 그래프")],
    [".breadcrumb-container", (el) => el.setAttribute("aria-label", "현재 위치")],
  ]
  function apply() {
    for (const [sel, fix] of fixes) document.querySelectorAll(sel).forEach(fix)
  }
  document.addEventListener("nav", apply)
  document.addEventListener("render", apply)
})()
`

// 태그 표시 이름: Quartz는 태그를 소문자 슬러그(예: "isaac-sim")로 보여 준다.
// 노션 동기화가 만든 .notion-sync/tag-labels.json (슬러그 → 원래 이름) 을 빌드 때 읽어
// 스크립트에 넣고, 화면의 태그 링크·태그 페이지 제목만 원래 이름("Isaac Sim")으로 바꾼다.
// 링크 주소(/tags/isaac-sim)는 그대로다.
function readTagLabels(file) {
  try {
    const data = JSON.parse(readFileSync(path.resolve(process.cwd(), file), "utf8"))
    return data && typeof data === "object" && !Array.isArray(data) ? data : {}
  } catch {
    return {}
  }
}

const tagLabelScript = (labels) => `
(() => {
  const LABELS = ${JSON.stringify(labels)}
  const label = (text) => {
    const raw = (text ?? "").trim()
    const hash = raw.startsWith("#") ? "#" : ""
    return LABELS[raw.slice(hash.length)] !== undefined ? hash + LABELS[raw.slice(hash.length)] : undefined
  }
  function apply() {
    for (const a of document.querySelectorAll("a.tag-link")) {
      const next = label(a.textContent)
      if (next !== undefined && a.childElementCount === 0) a.textContent = next
    }
    // 태그 페이지(tags/<슬러그>) 제목과 탭 제목
    const slug = document.body?.dataset.slug ?? ""
    if (slug.startsWith("tags/")) {
      const name = LABELS[decodeURIComponent(slug.slice(5))]
      if (name !== undefined) {
        const h1 = document.querySelector(".page-header .article-title")
        if (h1 && h1.childElementCount === 0) h1.textContent = name
        document.title = document.title.replace(/^[^|]*/, (t) => t.replace(slug.slice(5), name))
      }
    }
  }
  document.addEventListener("nav", apply)
  document.addEventListener("render", apply)
})()
`

export const plugin = (opts) => ({
  name: "PostExtras",
  // 본문은 바꾸지 않는다. Quartz가 transformer로 인식하려면 이 메서드 중 하나가 있어야 한다.
  htmlPlugins() {
    return []
  },
  externalResources() {
    const labels = readTagLabels(opts?.tagLabelsFile ?? ".notion-sync/tag-labels.json")
    return {
      js: [
        { loadTime: "afterDOMReady", contentType: "inline", script: copyScript },
        { loadTime: "afterDOMReady", contentType: "inline", script: uiLabelScript },
        ...(Object.keys(labels).length
          ? [{ loadTime: "afterDOMReady", contentType: "inline", script: tagLabelScript(labels) }]
          : []),
      ],
    }
  },
})

export { PostNav } from "./components/index.js"

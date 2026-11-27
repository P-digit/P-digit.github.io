// P-digit 블로그 전용 로컬 플러그인 (빌드 단계 없는 플레인 ESM)
// - transformer: 코드 블록 복사 버튼 스크립트 + 영문 UI 라벨 한국어화 스크립트를 모든 페이지에 넣는다
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

export const plugin = () => ({
  name: "PostExtras",
  // 본문은 바꾸지 않는다. Quartz가 transformer로 인식하려면 이 메서드 중 하나가 있어야 한다.
  htmlPlugins() {
    return []
  },
  externalResources() {
    return {
      js: [
        { loadTime: "afterDOMReady", contentType: "inline", script: copyScript },
        { loadTime: "afterDOMReady", contentType: "inline", script: uiLabelScript },
      ],
    }
  },
})

export { PostNav } from "./components/index.js"

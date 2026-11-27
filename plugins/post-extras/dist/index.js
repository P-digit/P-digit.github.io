import { readFileSync } from "node:fs"
import path from "node:path"

// P-digit 블로그 전용 로컬 플러그인 (빌드 단계 없는 플레인 ESM)
// - transformer: 첫 화면 범주 카드 글 수(renderTransforms) +
//   코드 블록 복사 버튼 · 영문 UI 라벨 한국어화 · 태그 표시 이름 · 모션 · 목록 더 보기 스크립트와
//   외부 스타일시트(웹 글꼴, stylesheets 옵션)를 모든 페이지에 넣는다
// - component: PostNav (dist/components/index.js)
// 스타일은 quartz/styles/custom.scss 에 있다 (.code-actions, .post-nav)

// 브라우저에서 실행되는 스크립트. SPA 이동마다 "nav" 이벤트가 오고,
// 복호화 등으로 본문이 바뀌면 "render" 가 온다 → 두 번 돌아도 안전하게 만든다.
const copyScript = `
(() => {
  const LABEL = "복사"
  const DONE = "복사됨"
  const FAIL = "실패"
  // 상태별 아이콘 (이슈 28): 클립보드 · 체크 · 엑스. stroke 는 글자색을 따른다
  const svg = (paths) =>
    '<svg class="code-copy__icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    paths +
    "</svg>"
  const ICON = {
    idle: svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'),
    done: svg('<path d="M20 6 9 17l-5-5"/>'),
    fail: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
  }
  // 화면 읽기 프로그램에도 상태를 알린다 (이슈 30): aria-label 갱신 + 화면 밖 알림 영역
  const ARIA = { idle: "코드 복사", done: "코드를 복사했습니다", fail: "코드를 복사하지 못했습니다" }
  function announce(text) {
    let live = document.getElementById("sr-status")
    if (!live) {
      live = document.createElement("div")
      live.id = "sr-status"
      live.className = "sr-only"
      live.setAttribute("role", "status")
      live.setAttribute("aria-live", "polite")
      document.body.appendChild(live)
    }
    live.textContent = ""
    requestAnimationFrame(() => (live.textContent = text))
  }
  const setState = (btn, state, label) => {
    btn.innerHTML = ICON[state] + '<span class="code-copy__label">' + label + "</span>"
    btn.setAttribute("aria-label", ARIA[state])
    if (state === "idle") delete btn.dataset.state
    else {
      btn.dataset.state = state
      announce(ARIA[state])
    }
  }
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
      setState(btn, "idle", LABEL)
      btn.setAttribute("aria-label", "코드 복사")
      let timer
      const onClick = async () => {
        try {
          await writeClipboard(codeText(pre))
          setState(btn, "done", DONE)
        } catch {
          setState(btn, "fail", FAIL)
        }
        clearTimeout(timer)
        timer = setTimeout(() => {
          setState(btn, "idle", LABEL)
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

// 모션 · 동적 효과 (PR 17). 모양은 custom.scss "모션" 절.
// - 페이지 등장: nav 마다 .center 에 page-enter 클래스를 다시 붙여 CSS 등장 애니메이션을 재생
//   (SPA 가 DOM 을 비교해 고치므로 CSS 만으로는 이동 때 다시 돌지 않는다)
// - 읽기 진행 막대 · 맨 위로 버튼: 글 페이지에서만. body 비교 때 지워질 수 있어 nav 마다 다시 확인
// - 테마 전환: themechange 때 잠깐 색 전환을 켠다
// 움직임 줄이기(prefers-reduced-motion)면 등장·전환 애니메이션은 CSS 에서 꺼지고, 스크롤은 즉시 이동
const motionScript = `
(() => {
  const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const isArticle = () => {
    const slug = document.body?.dataset.slug ?? ""
    return slug !== "" && slug !== "index" && slug !== "404" && !slug.endsWith("/index") && !slug.startsWith("tags/")
  }

  function replayEnter() {
    const center = document.querySelector("#quartz-body > .center")
    if (!center) return
    center.classList.remove("page-enter")
    void center.offsetWidth // 클래스를 다시 붙여도 애니메이션이 처음부터 돌게
    center.classList.add("page-enter")
  }

  function ensure(id, make) {
    let el = document.getElementById(id)
    if (!el) {
      el = make()
      el.id = id
      document.body.appendChild(el)
    }
    return el
  }

  let ticking = false
  function onScroll() {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      ticking = false
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      const bar = document.getElementById("reading-progress")
      if (bar) bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ")"
      const top = document.getElementById("back-to-top")
      if (top) top.toggleAttribute("data-visible", window.scrollY > 600)
    })
  }

  function setup() {
    replayEnter()
    const article = isArticle()
    const bar = ensure("reading-progress", () => {
      const el = document.createElement("div")
      el.className = "reading-progress"
      el.setAttribute("aria-hidden", "true")
      return el
    })
    bar.hidden = !article
    const top = ensure("back-to-top", () => {
      const el = document.createElement("button")
      el.type = "button"
      el.className = "back-to-top"
      el.setAttribute("aria-label", "맨 위로")
      el.title = "맨 위로"
      // 글자 "↑" 는 글꼴마다 위치가 달라 SVG 화살표로 (이슈 27)
      el.innerHTML =
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>'
      el.addEventListener("click", () =>
        window.scrollTo({ top: 0, behavior: reduce() ? "instant" : "smooth" }),
      )
      return el
    })
    top.hidden = !article
    onScroll()
  }

  window.addEventListener("scroll", onScroll, { passive: true })
  window.addEventListener("resize", onScroll, { passive: true })
  document.addEventListener("nav", setup)

  document.addEventListener("themechange", () => {
    if (reduce()) return
    const html = document.documentElement
    html.classList.add("theme-transition")
    clearTimeout(window.__themeTransitionTimer)
    window.__themeTransitionTimer = setTimeout(() => html.classList.remove("theme-transition"), 450)
  })
})()
`

// ───────── 첫 화면 범주 카드 글 수 (빌드 때 본문 트리에 넣는다, PR 19) ─────────
// content/index.md 의 <a class="home-card" href="./<폴더>/"> 카드마다 그 폴더의 글 수를
// 제목 옆에 붙인다("4편"). 글이 없으면 "준비 중" + 카드에 home-card--empty.
const classesOf = (node) => {
  const c = node.properties?.className
  return Array.isArray(c) ? c.map(String) : typeof c === "string" ? c.split(/\s+/) : []
}

function walk(node, visit) {
  visit(node)
  for (const child of node.children ?? []) walk(child, visit)
}

function findFirst(node, pred) {
  let found
  walk(node, (n) => {
    if (!found && n.type === "element" && pred(n)) found = n
  })
  return found
}

const isPost = (slug, folder) =>
  typeof slug === "string" && slug.startsWith(folder + "/") && !slug.endsWith("/index")

function addCategoryCounts(root, slug, data) {
  if (slug !== "index") return
  const files = data?.allFiles ?? []
  walk(root, (node) => {
    if (node.type !== "element" || node.tagName !== "a") return
    if (!classesOf(node).includes("home-card")) return
    const m = String(node.properties?.href ?? "").match(/^\.\/([^/]+)\/$/)
    if (!m) return
    const n = files.filter((f) => isPost(f.slug, m[1])).length
    const title = findFirst(node, (el) => classesOf(el).includes("home-card__title"))
    if (!title || findFirst(title, (el) => classesOf(el).includes("home-card__count"))) return
    title.children.push({
      type: "element",
      tagName: "span",
      properties: { className: ["home-card__count"] },
      children: [
        // 화면 읽기 프로그램이 "연재 중 4편"을 이어 읽지 않게 보이지 않는 쉼표 (이슈 29)
        {
          type: "element",
          tagName: "span",
          properties: { className: ["sr-only"] },
          children: [{ type: "text", value: ", " }],
        },
        { type: "text", value: n > 0 ? `${n}편` : "준비 중" },
      ],
    })
    if (n === 0) node.properties.className = [...classesOf(node), "home-card--empty"]
  })
}

// ───────── 목록 "더 보기" (PR 21) ─────────
// 범주·태그 목록(.page-listing ul.section-ul)이 pageSize 보다 길면 처음 pageSize 개만 보이고
// "더 보기 (N개 남음)" 버튼으로 pageSize 개씩 더 보인다. 새로 보인 첫 글로 초점을 옮긴다.
// URL 이 바뀌지 않아 SPA·검색·이전/다음 글과 충돌하지 않는다.
const listScript = (pageSize) => `
(() => {
  const SIZE = ${pageSize}
  let seq = 0
  function setup() {
    for (const ul of document.querySelectorAll(".page-listing ul.section-ul")) {
      if (ul.dataset.paged) continue
      const items = Array.from(ul.children).filter((li) => li.matches("li.section-li"))
      if (items.length <= SIZE) continue
      ul.dataset.paged = "1"
      if (!ul.id) ul.id = "listing-" + ++seq
      items.forEach((li, i) => (li.hidden = i >= SIZE))
      const btn = document.createElement("button")
      btn.type = "button"
      btn.className = "list-more"
      btn.setAttribute("aria-controls", ul.id)
      const update = () => {
        const rest = items.filter((li) => li.hidden).length
        if (rest === 0) return btn.remove()
        btn.textContent = "더 보기 (" + rest + "개 남음)"
      }
      const onClick = () => {
        const next = items.filter((li) => li.hidden).slice(0, SIZE)
        next.forEach((li) => (li.hidden = false))
        next[0]?.querySelector("h3 a, a")?.focus({ preventScroll: true })
        update()
      }
      btn.addEventListener("click", onClick)
      window.addCleanup?.(() => btn.removeEventListener("click", onClick))
      ul.after(btn)
      update()
    }
  }
  document.addEventListener("nav", setup)
  document.addEventListener("render", setup)
})()
`

export const plugin = (opts) => ({
  name: "PostExtras",
  // 본문은 바꾸지 않는다. Quartz가 transformer로 인식하려면 이 메서드 중 하나가 있어야 한다.
  htmlPlugins() {
    return []
  },
  renderTransforms() {
    return { after: [addCategoryCounts] }
  },
  externalResources() {
    const labels = readTagLabels(opts?.tagLabelsFile ?? ".notion-sync/tag-labels.json")
    // 외부 스타일시트(웹 글꼴 등): <link rel="stylesheet"> 로 들어간다
    const stylesheets = (opts?.stylesheets ?? []).filter((u) => typeof u === "string" && u)
    return {
      css: stylesheets.map((content) => ({ content })),
      js: [
        { loadTime: "afterDOMReady", contentType: "inline", script: copyScript },
        { loadTime: "afterDOMReady", contentType: "inline", script: uiLabelScript },
        { loadTime: "afterDOMReady", contentType: "inline", script: motionScript },
        {
          loadTime: "afterDOMReady",
          contentType: "inline",
          script: listScript(Number(opts?.listPageSize) > 0 ? Number(opts.listPageSize) : 10),
        },
        ...(Object.keys(labels).length
          ? [{ loadTime: "afterDOMReady", contentType: "inline", script: tagLabelScript(labels) }]
          : []),
      ],
    }
  },
})

export { PostNav } from "./components/index.js"

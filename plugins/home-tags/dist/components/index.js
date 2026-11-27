import { readFileSync } from "node:fs"
import path from "node:path"
import { h } from "preact"

// 첫 화면 태그 칩 — 예전엔 content/index.md 에 손으로 적었다(새 태그가 생기면 직접 추가).
// 이제 모든 글의 태그를 세어 많이 쓰인 순으로 보여 주고, 이름은 노션 동기화가 만든
// .notion-sync/tag-labels.json(슬러그 → 원래 이름)에서 가져온다. 빌드 때 그리므로 깜빡임이 없다.
// 스타일: quartz/styles/custom.scss 의 .home-tags

function readLabels(file) {
  try {
    const data = JSON.parse(readFileSync(path.resolve(process.cwd(), file), "utf8"))
    return data && typeof data === "object" && !Array.isArray(data) ? data : {}
  } catch {
    return {}
  }
}

const isContentPage = (slug) =>
  typeof slug === "string" &&
  slug !== "index" &&
  !slug.endsWith("/index") &&
  !slug.startsWith("tags/")

export function countTags(allFiles) {
  const counts = new Map()
  for (const f of allFiles ?? []) {
    if (!isContentPage(f.slug)) continue
    for (const tag of new Set(f.frontmatter?.tags ?? [])) {
      if (typeof tag === "string" && tag) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return counts
}

const HomeTagsConstructor = (opts) => {
  const options = { limit: 12, tagLabelsFile: ".notion-sync/tag-labels.json", ...opts }
  const HomeTags = ({ allFiles, displayClass }) => {
    const labels = readLabels(options.tagLabelsFile)
    const name = (slug) => labels[slug] ?? slug
    const counts = countTags(allFiles)
    const total = counts.size
    const tags = [...counts]
      .sort(([a, ca], [b, cb]) => cb - ca || name(a).localeCompare(name(b), "ko"))
      .slice(0, options.limit)
    if (tags.length === 0) return null

    const cls = ["home-tags", displayClass].filter(Boolean).join(" ")
    return h(
      "nav",
      { class: cls, "aria-label": "태그로 찾기" },
      h("span", { class: "home-tags__label" }, "태그"),
      ...tags.map(([slug, count]) =>
        h(
          "a",
          { href: `./tags/${slug}`, class: "home-tag internal", title: `글 ${count}개` },
          name(slug),
          h("span", { class: "home-tag__count", "aria-label": `글 ${count}개` }, String(count)),
        ),
      ),
      // 전체 태그 수를 함께 (Gemini PR 11 제안, 이슈 21)
      h(
        "a",
        { href: "./tags/", class: "home-tag home-tag--all internal" },
        `전체 태그 ${total}개 →`,
      ),
    )
  }
  return HomeTags
}

export { HomeTagsConstructor as HomeTags }

import { h } from "preact"

// 같은 범주(폴더) 안의 글을 날짜순으로 세워 이전/다음 글을 잇는다.
// 예: robotics/1일차 → robotics/2일차 → …  (범주 소개 index, 태그 등 가상 페이지는 제외)

function folderOf(slug) {
  const i = slug.lastIndexOf("/")
  return i === -1 ? "" : slug.slice(0, i)
}

function dateOf(file) {
  const raw = file.frontmatter?.date ?? file.dates?.created
  const t = raw ? new Date(raw).getTime() : NaN
  return Number.isNaN(t) ? 0 : t
}

function titleOf(file) {
  return file.frontmatter?.title ?? file.slug.split("/").pop()
}

function basenameHref(slug) {
  return "./" + slug.split("/").pop()
}

const PostNavConstructor = () => {
  const PostNav = ({ fileData, allFiles }) => {
    const slug = fileData?.slug
    if (!slug || slug === "index" || slug.endsWith("/index")) return null
    const folder = folderOf(slug)
    if (!folder || folder === "tags" || folder.startsWith("tags/")) return null

    const siblings = (allFiles ?? [])
      .filter(
        (f) =>
          typeof f.slug === "string" &&
          folderOf(f.slug) === folder &&
          !f.slug.endsWith("/index") &&
          f.frontmatter?.title,
      )
      .sort(
        (a, b) => dateOf(a) - dateOf(b) || a.slug.localeCompare(b.slug, "ko", { numeric: true }),
      )

    const i = siblings.findIndex((f) => f.slug === slug)
    if (i === -1 || siblings.length < 2) return null
    const prev = siblings[i - 1]
    const next = siblings[i + 1]

    const link = (file, dir) =>
      h(
        "a",
        { href: basenameHref(file.slug), class: `internal post-nav__link post-nav__link--${dir}` },
        h("span", { class: "post-nav__dir" }, dir === "prev" ? "← 이전 글" : "다음 글 →"),
        h("span", { class: "post-nav__title" }, titleOf(file)),
      )

    return h(
      "nav",
      { class: "post-nav", "aria-label": "이전 글과 다음 글" },
      prev ? link(prev, "prev") : h("span", { class: "post-nav__spacer", "aria-hidden": "true" }),
      next ? link(next, "next") : null,
    )
  }
  return PostNav
}

export { PostNavConstructor as PostNav }

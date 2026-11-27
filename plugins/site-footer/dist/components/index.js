import { h } from "preact"

// 한국어 푸터 (footer 대체)
// footer 플러그인의 ko-KR 번역이 "Created with" 영문이라 직접 만든다. 스타일은 custom.scss 의 .site-footer

const SiteFooterConstructor = (opts) => {
  const options = { author: "", links: {}, ...opts }
  const SiteFooter = ({ displayClass }) => {
    const year = new Date().getFullYear()
    const cls = ["site-footer", displayClass].filter(Boolean).join(" ")
    const links = Object.entries(options.links ?? {})
    return h(
      "footer",
      { class: cls },
      h(
        "p",
        null,
        `© ${year}${options.author ? ` ${options.author}` : ""} · `,
        h("a", { href: "https://quartz.jzhao.xyz/" }, "Quartz"),
        "로 만들었습니다",
      ),
      links.length
        ? h("ul", null, ...links.map(([name, href]) => h("li", null, h("a", { href }, name))))
        : null,
    )
  }
  return SiteFooter
}

export { SiteFooterConstructor as SiteFooter }

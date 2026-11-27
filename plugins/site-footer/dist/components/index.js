import { h } from "preact"

// 한국어 푸터 (footer 대체)
// footer 플러그인의 ko-KR 번역이 "Created with" 영문이라 직접 만든다. 스타일은 custom.scss 의 .site-footer
// links 옵션에는 외부 주소만 넣는다(모두 새 탭으로 연다).

// 외부 링크는 새 탭으로 (rel 로 opener 차단), 화면 읽기 프로그램에는 새 탭임을 알린다
const external = (href, text) =>
  h(
    "a",
    { href, target: "_blank", rel: "noopener noreferrer", "aria-label": `${text} (새 탭)` },
    text,
  )

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
        external("https://quartz.jzhao.xyz/", "Quartz"),
        "로 만들었습니다",
      ),
      links.length
        ? h("ul", null, ...links.map(([name, href]) => h("li", null, external(href, name))))
        : null,
    )
  }
  return SiteFooter
}

export { SiteFooterConstructor as SiteFooter }

import { h } from "preact"

// 날짜 · 읽는 시간 (content-meta 대체)
// content-meta 플러그인의 ko-KR 번역이 "N min read" 영문이라 같은 마크업(p.content-meta)으로
// 한국어 문구를 낸다. custom.scss 의 .content-meta 규칙(글 머리 배치, 가운뎃점 구분)이 그대로 적용된다.

const HANGUL = /[\u3131-\u318E\uAC00-\uD7A3]/g
const LATIN_WORD = /[A-Za-z0-9_]+(?:['’.-][A-Za-z0-9_]+)*/g

// 한글은 분당 약 500자, 영문·숫자 단어는 분당 200단어로 어림한다.
export function readingMinutes(text) {
  const hangul = (text.match(HANGUL) ?? []).length
  const words = (text.replace(HANGUL, " ").match(LATIN_WORD) ?? []).length
  return Math.max(1, Math.ceil(hangul / 500 + words / 200))
}

function pageDate(fileData, cfg) {
  const type = fileData.defaultDateType ?? cfg?.defaultDateType
  const raw = type ? fileData.dates?.[type] : undefined
  if (!raw) return undefined
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? undefined : d
}

const PostMetaConstructor = (opts) => {
  const options = { showReadingTime: true, ...opts }
  const PostMeta = ({ fileData, cfg, displayClass }) => {
    const text = fileData?.text
    if (!text) return null
    const locale = cfg?.locale ?? "ko-KR"
    const segments = []
    const date = pageDate(fileData, cfg)
    if (date) {
      const label = date.toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })
      segments.push(h("time", { datetime: date.toISOString() }, label))
    }
    if (options.showReadingTime) {
      segments.push(h("span", null, `약 ${readingMinutes(text)}분`))
    }
    if (segments.length === 0) return null
    const cls = ["content-meta", displayClass].filter(Boolean).join(" ")
    return h("p", { "show-comma": "true", class: cls }, ...segments)
  }
  return PostMeta
}

export { PostMetaConstructor as PostMeta }

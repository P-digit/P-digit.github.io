import type { QuartzComponentConstructor } from "@quartz-community/types"

/** 날짜 · 읽는 시간 (content-meta 대체, 한국어) */
export declare const PostMeta: QuartzComponentConstructor<{ showReadingTime?: boolean }>
/** 한글 분당 500자 · 영문 분당 200단어 기준 읽는 시간(분) */
export declare function readingMinutes(text: string): number

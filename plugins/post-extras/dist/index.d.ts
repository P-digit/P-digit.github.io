import type { QuartzTransformerPlugin, QuartzComponentConstructor } from "@quartz-community/types"

/** 코드 블록 복사 버튼 스크립트를 넣는 transformer (본문은 바꾸지 않음) */
export declare const plugin: QuartzTransformerPlugin<{
  tagLabelsFile?: string
  stylesheets?: string[]
}>
/** 같은 범주 안 이전/다음 글 내비게이션 */
export declare const PostNav: QuartzComponentConstructor

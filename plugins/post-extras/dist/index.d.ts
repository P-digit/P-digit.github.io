import type { QuartzTransformerPlugin, QuartzComponentConstructor } from "@quartz-community/types"

/** 코드 복사·UI 라벨·태그 이름·모션·목록 더 보기 스크립트 + 첫 화면 범주 카드 글 수(renderTransforms) */
export declare const plugin: QuartzTransformerPlugin<{
  tagLabelsFile?: string
  stylesheets?: string[]
  listPageSize?: number
}>
/** 같은 범주 안 이전/다음 글 내비게이션 */
export declare const PostNav: QuartzComponentConstructor

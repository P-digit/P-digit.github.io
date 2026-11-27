#!/usr/bin/env node
// 노션 '학습 기록' DB에서 "공개"가 체크된 페이지를 Quartz용 마크다운으로 내보낸다.
// 의존성 없음 (Node 20+ 의 내장 fetch 사용).
//
// 환경 변수
//   NOTION_TOKEN        (필수) 노션 내부 통합 토큰
//   NOTION_DATABASE_ID  (필수) 학습 기록 DB ID
//   CONTENT_DIR         콘텐츠 루트 폴더         (기본: content) — 글은 <루트>/<카테고리 폴더>/ 에 쓴다
//   ATTACH_DIR          이미지를 받을 폴더       (기본: content/attachments/notion)
//   MANIFEST_PATH       동기화 기록 파일         (기본: .notion-sync/manifest.json)
//   TAG_LABELS_PATH     태그 표시 이름표         (기본: .notion-sync/tag-labels.json)
//   PUBLISH_PROPERTY    공개 체크박스 속성 이름   (기본: 공개)
//   NOTION_VERSION      노션 API 버전           (기본: 2022-06-28)

import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const env = process.env;
const CONFIG = {
  token: env.NOTION_TOKEN,
  databaseId: env.NOTION_DATABASE_ID,
  contentDir: env.CONTENT_DIR || "content",
  attachDir: env.ATTACH_DIR || "content/attachments/notion",
  manifestPath: env.MANIFEST_PATH || ".notion-sync/manifest.json",
  tagLabelsPath: env.TAG_LABELS_PATH || ".notion-sync/tag-labels.json",
  publishProp: env.PUBLISH_PROPERTY || "공개",
  notionVersion: env.NOTION_VERSION || "2022-06-28",
};

// 노션 DB 속성 이름 → 쓰임새. DB 속성 이름을 바꾸면 여기만 고치면 된다.
const PROPS = {
  title: "제목",
  slug: "슬러그",
  date: "날짜",
  summary: "한 줄 요약",
  tags: ["키워드", "세션"], // 둘 다 태그로 합친다
  course: "강의명",
  day: "일차",
  category: "카테고리",
};

// 노션 '카테고리' 선택지 → 블로그 폴더(URL). 폴더마다 content/<폴더>/index.md 가 있어야 한다.
export const CATEGORIES = {
  로보틱스: "robotics",
  알고리즘: "algorithm",
  임베디드: "embedded",
  개발: "dev",
  회고: "retro",
};

// ───────────────────────── 노션 API ─────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function notion(method, endpoint, body) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`https://api.notion.com/v1${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${CONFIG.token}`,
        "Notion-Version": CONFIG.notionVersion,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 429 || res.status >= 500) {
      const wait = Number(res.headers.get("retry-after") || 1) * 1000 * (attempt + 1);
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      throw new Error(`Notion API ${method} ${endpoint} → ${res.status}: ${await res.text()}`);
    }
    return res.json();
  }
  throw new Error(`Notion API ${method} ${endpoint}: 재시도 한도 초과`);
}

async function queryPublishedPages() {
  const pages = [];
  let cursor;
  do {
    const data = await notion("POST", `/databases/${CONFIG.databaseId}/query`, {
      filter: { property: CONFIG.publishProp, checkbox: { equals: true } },
      sorts: [{ property: PROPS.date, direction: "ascending" }],
      start_cursor: cursor,
      page_size: 100,
    });
    pages.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return pages;
}

async function getChildren(blockId) {
  const blocks = [];
  let cursor;
  do {
    const qs = new URLSearchParams({ page_size: "100" });
    if (cursor) qs.set("start_cursor", cursor);
    const data = await notion("GET", `/blocks/${blockId}/children?${qs}`);
    blocks.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  for (const b of blocks) {
    // 동기화 블록 사본은 원본 블록의 자식을 읽어야 한다
    const source = b.type === "synced_block" && b.synced_block?.synced_from?.block_id;
    if (b.has_children || source) b.children = await getChildren(source || b.id);
  }
  return blocks;
}

// ───────────────────────── 속성 읽기 ─────────────────────────

const plain = (rt = []) => rt.map((t) => t.plain_text).join("");

function readProp(page, name) {
  const p = page.properties?.[name];
  if (!p) return undefined;
  switch (p.type) {
    case "title": return plain(p.title);
    case "rich_text": return plain(p.rich_text);
    case "number": return p.number;
    case "select": return p.select?.name;
    case "multi_select": return p.multi_select.map((o) => o.name);
    case "date": return p.date?.start;
    case "checkbox": return p.checkbox;
    case "url": return p.url;
    default: return undefined;
  }
}

// ───────────────────────── 슬러그 ─────────────────────────

export function slugify(text) {
  return text
    .normalize("NFC")
    .replace(/[·•]/g, " ")
    .replace(/[\\/:*?"<>|#^[\]{}%&'`!@$=+,;~()]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

// ───────────────────────── 블록 → 마크다운 ─────────────────────────

const CODE_LANG = {
  "plain text": "", "c++": "cpp", "c#": "csharp", shell: "bash", "objective-c": "objc",
  "f#": "fsharp", "vb.net": "vbnet", "java/c/c++/c#": "", markup: "html",
};

export function richText(rt = []) {
  return rt
    .map((t) => {
      if (t.type === "equation") return `$${t.equation.expression}$`;
      let s = t.plain_text;
      if (!s) return "";
      const a = t.annotations || {};
      if (a.code) {
        s = s.includes("`") ? `\`\` ${s} \`\`` : `\`${s}\``;
      } else {
        // 앞뒤 공백은 강조 기호 밖으로 빼야 마크다운이 깨지지 않는다
        const [, lead, core, trail] = s.match(/^(\s*)([\s\S]*?)(\s*)$/);
        let c = core;
        if (c) {
          if (a.bold) c = `**${c}**`;
          if (a.italic) c = `*${c}*`;
          if (a.strikethrough) c = `~~${c}~~`;
        }
        s = lead + c + trail;
      }
      const href = t.href || t.text?.link?.url;
      if (href) s = `[${s}](${href})`;
      return s;
    })
    .join("");
}

const indent = (text, prefix) =>
  text.split("\n").map((l) => (l ? prefix + l : l)).join("\n");

const quote = (text) =>
  text.split("\n").map((l) => (l ? `> ${l}` : ">")).join("\n");

function fileUrl(obj) {
  return obj?.type === "external" ? obj.external.url : obj?.file?.url;
}

/**
 * ctx.assets: Map<blockId, {url, filename}> — 다운로드할 노션 파일 목록
 * ctx.assetBase: 글에서 이미지를 가리킬 경로 앞부분
 */
export function blocksToMarkdown(blocks = [], ctx) {
  const out = [];
  let prevType = null;
  for (const b of blocks) {
    const md = blockToMarkdown(b, ctx);
    if (md == null) continue;
    const isList = /list_item|to_do/.test(b.type);
    // 같은 종류의 목록 항목은 빈 줄 없이 붙인다 (느슨한 목록 방지)
    const sep = out.length === 0 ? "" : isList && prevType === b.type ? "\n" : "\n\n";
    out.push(sep + md);
    prevType = b.type;
  }
  return out.join("");
}

function childrenMd(b, ctx) {
  return b.children?.length ? blocksToMarkdown(b.children, ctx) : "";
}

function blockToMarkdown(b, ctx) {
  const v = b[b.type] || {};
  const text = () => richText(v.rich_text);
  switch (b.type) {
    case "paragraph": {
      const t = text();
      const kids = childrenMd(b, ctx);
      return [t, kids].filter(Boolean).join("\n\n") || null;
    }
    case "heading_1":
    case "heading_2":
    case "heading_3": {
      const level = Number(b.type.slice(-1)) + 1; // 페이지 제목이 h1이라 한 단계씩 내린다
      const h = `${"#".repeat(Math.min(level, 6))} ${text()}`;
      const kids = childrenMd(b, ctx); // 접기 제목의 내용은 그대로 펼친다
      return kids ? `${h}\n\n${kids}` : h;
    }
    case "bulleted_list_item":
    case "numbered_list_item":
    case "to_do": {
      const marker =
        b.type === "bulleted_list_item" ? "- " :
        b.type === "numbered_list_item" ? "1. " :
        `- [${v.checked ? "x" : " "}] `;
      const pad = " ".repeat(b.type === "numbered_list_item" ? 3 : 2);
      const kids = childrenMd(b, ctx);
      return `${marker}${text()}` + (kids ? `\n${indent(kids, pad)}` : "");
    }
    case "toggle": {
      // Quartz(Obsidian) 접기 콜아웃으로 변환
      const summary = text();
      const kind = /^Q\d*[.)]?\s/.test(summary) ? "question" : "note";
      const kids = childrenMd(b, ctx);
      return quote(`[!${kind}]- ${summary}` + (kids ? `\n${kids}` : ""));
    }
    case "quote": {
      const kids = childrenMd(b, ctx);
      return quote(text() + (kids ? `\n\n${kids}` : ""));
    }
    case "callout": {
      const icon = v.icon?.type === "emoji" ? `${v.icon.emoji} ` : "";
      const kids = childrenMd(b, ctx);
      return quote(`[!note] ${icon}${text()}` + (kids ? `\n${kids}` : ""));
    }
    case "code": {
      const raw = (v.language || "").toLowerCase();
      const lang = raw in CODE_LANG ? CODE_LANG[raw] : raw.replace(/\s+/g, "");
      const code = plain(v.rich_text);
      const fence = code.includes("```") ? "````" : "```";
      const cap = plain(v.caption);
      return `${fence}${lang}\n${code}\n${fence}` + (cap ? `\n\n*${cap}*` : "");
    }
    case "equation":
      return `$$\n${v.expression}\n$$`;
    case "divider":
      return "---";
    case "table": {
      const rows = (b.children || []).filter((r) => r.type === "table_row");
      if (!rows.length) return null;
      const cell = (c) =>
        richText(c).replace(/\|/g, "\\|").replace(/\n/g, "<br>") || " ";
      const lines = rows.map((r) => `| ${r.table_row.cells.map(cell).join(" | ")} |`);
      const width = rows[0].table_row.cells.length;
      const sepLine = `| ${Array(width).fill("---").join(" | ")} |`;
      if (v.has_column_header) lines.splice(1, 0, sepLine);
      else lines.unshift(`| ${Array(width).fill(" ").join(" | ")} |`, sepLine);
      return lines.join("\n");
    }
    case "image": {
      const cap = plain(v.caption);
      const src = assetPath(b, v, ctx, "png");
      return src ? `![${cap.replace(/[[\]]/g, "")}](${src})` : null;
    }
    case "video": {
      const src = assetPath(b, v, ctx, "mp4");
      return src ? `![](${src})` : null; // Quartz는 YouTube 링크도 임베드로 보여준다
    }
    case "pdf":
    case "file":
    case "audio": {
      const src = assetPath(b, v, ctx, b.type === "pdf" ? "pdf" : "bin");
      const name = v.name || plain(v.caption) || "첨부 파일";
      return src ? `[📎 ${name}](${src})` : null;
    }
    case "bookmark":
    case "embed":
    case "link_preview": {
      const cap = plain(v.caption);
      return v.url ? `[${cap || v.url}](${v.url})` : null;
    }
    case "column_list":
    case "column":
    case "synced_block":
      return childrenMd(b, ctx) || null;
    case "child_page":
    case "child_database":
    case "table_of_contents":
    case "breadcrumb":
    case "link_to_page":
    case "unsupported":
      return null; // 공개 글에는 넣지 않는다
    default:
      return v.rich_text ? text() || null : null;
  }
}

function assetPath(b, v, ctx, fallbackExt) {
  if (v.type === "external") return v.external.url;
  const url = fileUrl(v);
  if (!url) return null;
  // 노션 파일 주소는 1시간 뒤 만료되므로 저장소로 내려받는다
  let ext = path.extname(new URL(url).pathname).slice(1).toLowerCase();
  if (!ext || ext.length > 5) ext = fallbackExt;
  const filename = `${b.id.replace(/-/g, "")}.${ext}`;
  ctx.assets.set(b.id, { url, filename });
  return `${ctx.assetBase}/${filename}`;
}

// ───────────────────────── 페이지 → 파일 ─────────────────────────

const yamlStr = (s) => JSON.stringify(String(s)); // JSON 문자열은 유효한 YAML

// 노션 키워드·세션 값 (원래 표기, 예: "Isaac Sim")
export function tagNames(page) {
  return [...new Set(
    PROPS.tags.flatMap((n) => {
      const v = readProp(page, n);
      return Array.isArray(v) ? v : v ? [v] : [];
    }).map((t) => t.trim()).filter(Boolean),
  )];
}

// frontmatter 태그: 공백은 '-' (예: "Isaac-Sim")
const tagValue = (name) => name.replace(/\s+/g, "-");

// Quartz가 frontmatter 태그를 바꾸는 규칙(@quartz-community/utils slugTag)과 같게 맞춘다.
// 블로그에는 이 슬러그(예: "isaac-sim")가 표시되므로 이름표의 키로 쓴다.
export function quartzTagSlug(tag) {
  return tag
    .normalize("NFC")
    .split("/")
    .map((seg) =>
      seg
        .replace(/\s/g, "-")
        .replace(/&/g, "-and-")
        .replace(/%/g, "-percent")
        .replace(/\?/g, "")
        .replace(/#/g, "")
        .replace(/[<>:"|*]/g, "")
        .toLowerCase(),
    )
    .join("/")
    .replace(/\/$/, "");
}

// 태그 슬러그 → 원래 이름 표 (plugins/post-extras 가 화면의 태그 표시를 바꿀 때 쓴다)
// 슬러그와 원래 이름이 같은 태그(예: "센서")는 넣지 않는다.
export function tagLabels(pages) {
  const labels = {};
  for (const page of pages) {
    for (const name of tagNames(page)) {
      const slug = quartzTagSlug(tagValue(name));
      if (slug !== name && !(slug in labels)) labels[slug] = name;
    }
  }
  return Object.fromEntries(Object.entries(labels).sort(([a], [b]) => a.localeCompare(b)));
}

export function frontmatter(page, aliases = []) {
  const title = readProp(page, PROPS.title) || "제목 없음";
  const date = readProp(page, PROPS.date) || page.created_time?.slice(0, 10);
  const summary = readProp(page, PROPS.summary);
  const tags = [...new Set(tagNames(page).map(tagValue))];
  const lines = ["---", `title: ${yamlStr(title)}`];
  if (date) lines.push(`date: ${date}`);
  if (summary) lines.push(`description: ${yamlStr(summary)}`);
  if (tags.length) lines.push("tags:", ...tags.map((t) => `  - ${yamlStr(t)}`));
  // 예전 주소 → 지금 주소 리다이렉트 (카테고리·슬러그가 바뀌어도 옛 링크가 살아 있게)
  if (aliases.length) lines.push("aliases:", ...aliases.map((a) => `  - ${yamlStr(a)}`));
  lines.push(`notion_id: ${page.id}`, "---");
  return lines.join("\n");
}

export function pageHeader(page) {
  const course = readProp(page, PROPS.course);
  const day = readProp(page, PROPS.day);
  const meta = [day != null ? `${day}일차` : null, course].filter(Boolean).join(" · ");
  return meta ? `> ${meta}` : "";
}

// 카테고리가 비어 있으면: 강의 노트(일차·강의명이 있음)는 로보틱스, 나머지는 개발
export function categoryFolder(page) {
  const name = readProp(page, PROPS.category);
  if (name && CATEGORIES[name]) return CATEGORIES[name];
  if (name) console.warn(`  ! 모르는 카테고리 "${name}" → dev 폴더에 둔다 (CATEGORIES에 추가 필요)`);
  const isLecture = readProp(page, PROPS.day) != null || readProp(page, PROPS.course);
  return isLecture ? CATEGORIES["로보틱스"] : CATEGORIES["개발"];
}

export function baseSlug(page) {
  const custom = readProp(page, PROPS.slug);
  if (custom) return slugify(custom);
  const date = readProp(page, PROPS.date) || page.created_time?.slice(0, 10) || "";
  return slugify(`${date} ${readProp(page, PROPS.title) || page.id}`);
}

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`이미지 다운로드 실패 ${res.status}: ${dest}`);
  await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

export async function main() {
  if (!CONFIG.token || !CONFIG.databaseId) {
    console.error("NOTION_TOKEN 과 NOTION_DATABASE_ID 환경 변수가 필요합니다.");
    process.exit(1);
  }
  await fs.mkdir(CONFIG.contentDir, { recursive: true });
  await fs.mkdir(CONFIG.attachDir, { recursive: true });
  await fs.mkdir(path.dirname(CONFIG.manifestPath), { recursive: true });

  const manifest = (await exists(CONFIG.manifestPath))
    ? JSON.parse(await fs.readFile(CONFIG.manifestPath, "utf8"))
    : { pages: {} };

  const pages = await queryPublishedPages();
  console.log(`공개 페이지 ${pages.length}개`);

  const next = { pages: {} };
  const usedSlugs = new Set();
  const usedAssets = new Set();

  for (const page of pages) {
    const folder = categoryFolder(page);
    let slug = baseSlug(page);
    // index 는 카테고리 소개 페이지 자리라서 쓰지 않는다
    if (slug === "index" || usedSlugs.has(`${folder}/${slug}`)) slug = `${slug}-${page.id.slice(0, 8)}`;
    usedSlugs.add(`${folder}/${slug}`);
    const file = `${folder}/${slug}.md`; // CONFIG.contentDir 기준 경로
    await fs.mkdir(path.join(CONFIG.contentDir, folder), { recursive: true });

    // 글 폴더에서 첨부 폴더까지의 상대 경로 (예: ../attachments/notion)
    const assetBase = path
      .relative(path.join(CONFIG.contentDir, folder), CONFIG.attachDir)
      .split(path.sep)
      .join("/");

    // 파일 위치가 바뀌었으면 옛 주소를 alias 로 남긴다 (manifest 에 누적)
    const old = manifest.pages[page.id];
    const aliases = new Set(old?.aliases || []);
    if (old && old.file !== file) aliases.add(old.file.replace(/\.md$/, ""));
    aliases.delete(file.replace(/\.md$/, ""));

    const ctx = { assets: new Map(), assetBase };
    const blocks = await getChildren(page.id);
    const body = blocksToMarkdown(blocks, ctx);
    const header = pageHeader(page);
    const md = [frontmatter(page, [...aliases]), header, body].filter(Boolean).join("\n\n") + "\n";

    for (const { url, filename } of ctx.assets.values()) {
      usedAssets.add(filename);
      const dest = path.join(CONFIG.attachDir, filename);
      if (!(await exists(dest))) await download(url, dest);
    }

    if (old && old.file !== file) await fs.rm(path.join(CONFIG.contentDir, old.file), { force: true });
    await fs.writeFile(path.join(CONFIG.contentDir, file), md);
    next.pages[page.id] = {
      file,
      ...(aliases.size ? { aliases: [...aliases] } : {}),
      assets: [...ctx.assets.values()].map((a) => a.filename),
    };
    console.log(`  ✓ ${file}`);
  }

  // 공개를 해제했거나 삭제한 페이지는 블로그에서도 지운다 (이 스크립트가 만든 파일만)
  for (const [id, info] of Object.entries(manifest.pages)) {
    if (next.pages[id]) continue;
    await fs.rm(path.join(CONFIG.contentDir, info.file), { force: true });
    console.log(`  ✗ ${info.file} (비공개 전환)`);
  }
  const oldAssets = Object.values(manifest.pages).flatMap((p) => p.assets || []);
  for (const a of oldAssets) {
    if (!usedAssets.has(a)) await fs.rm(path.join(CONFIG.attachDir, a), { force: true });
  }

  await fs.writeFile(CONFIG.manifestPath, JSON.stringify(next, null, 2) + "\n");
  await fs.mkdir(path.dirname(CONFIG.tagLabelsPath), { recursive: true });
  await fs.writeFile(CONFIG.tagLabelsPath, JSON.stringify(tagLabels(pages), null, 2) + "\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

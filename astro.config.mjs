import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { satteri } from "@astrojs/markdown-satteri";
import { imgAttrsPlugin } from "./src/lib/img-attrs-plugin.mjs";

const SITE = "https://ajejeiya.cloud";

// ── 사이트맵용 글 정보 ─────────────────────────────────────────────
// 글 파일(src/content/blog/*.md)의 frontmatter에서 날짜·카테고리·태그를 읽는다.
// 파일 수정 시각(mtime)은 GitHub Actions에서 checkout할 때마다 바뀌므로 쓰지 않는다.
// 글 내용을 고치면 frontmatter에 updatedDate를 넣어야 사이트맵 lastmod와 dateModified에 반영된다.
const termSlug = (name) => String(name).trim().replace(/\s+/g, "-");
const unquote = (v) => v.trim().replace(/^["']|["']$/g, "");

function readPosts() {
  const dir = "./src/content/blog";
  let files = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  const posts = [];
  for (const file of files) {
    try {
      const text = readFileSync(join(dir, file), "utf8");
      const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!m) continue;
      const fm = m[1];
      const field = (key) => {
        const line = fm.match(new RegExp(`^${key}:[ \\t]*(.*)$`, "m"));
        return line ? unquote(line[1]) : undefined;
      };
      if (field("draft") === "true") continue;
      let tags = [];
      const tagLine = fm.match(/^tags:[ \t]*(\[.*\])[ \t]*$/m);
      if (tagLine) {
        try {
          tags = JSON.parse(tagLine[1]);
        } catch {
          tags = tagLine[1].slice(1, -1).split(",").map(unquote).filter(Boolean);
        }
      } else {
        // YAML 목록 형식(tags:\n  - a\n  - b)
        const block = fm.match(/^tags:[ \t]*\r?\n((?:[ \t]+-[ \t]*.*(?:\r?\n|$))+)/m);
        if (block) tags = block[1].split(/\r?\n/).map((l) => l.replace(/^[ \t]+-[ \t]*/, "")).map(unquote).filter(Boolean);
      }
      const dateStr = field("updatedDate") || field("pubDate");
      const date = dateStr ? new Date(dateStr) : undefined;
      posts.push({
        id: file.replace(/\.md$/, ""),
        date: date && !isNaN(date.valueOf()) ? date : undefined,
        category: field("category"),
        tags: Array.isArray(tags) ? tags.map(String) : [],
      });
    } catch {
      // 읽지 못한 글은 사이트맵 보강(lastmod)에서만 빠진다. 페이지 자체는 사이트맵에 그대로 남는다.
    }
  }
  return posts;
}

let postsCache;
const sitemapPosts = () => (postsCache ??= readPosts());
const latest = (list) => list.reduce((max, p) => (p.date && (!max || p.date > max) ? p.date : max), undefined);
// 글 페이지의 datePublished/dateModified(src/lib/posts.ts의 isoKst)와 같은 한국 시간 표기
const isoKst = (d) =>
  d.getUTCHours() + d.getUTCMinutes() + d.getUTCSeconds() + d.getUTCMilliseconds() === 0
    ? `${d.toISOString().slice(0, 10)}T00:00:00+09:00`
    : `${new Date(d.valueOf() + 9 * 3600 * 1000).toISOString().slice(0, 19)}+09:00`;
const setLastmod = (item, date) => {
  if (date) item.lastmod = isoKst(date);
  return item;
};

const sitemapOptions = {
  serialize(item) {
    const posts = sitemapPosts();
    const path = decodeURIComponent(new URL(item.url).pathname);

    // 얇은 페이지 제외: 검색 페이지(JS로만 결과를 그림), 404, 글이 1개뿐인 태그 페이지.
    // 이 페이지들에는 noindex 메타도 들어간다(Base.astro의 noindex).
    if (path === "/search/" || path === "/404/") return undefined;

    const tagMatch = path.match(/^\/tags\/([^/]+)\/$/);
    if (tagMatch) {
      const tagged = posts.filter((p) => p.tags.some((t) => termSlug(t) === tagMatch[1]));
      // 0개면 frontmatter를 못 읽은 경우이므로 빼지 않는다
      if (tagged.length === 1) return undefined;
      return setLastmod(item, latest(tagged));
    }
    const postMatch = path.match(/^\/blog\/([^/]+)\/$/);
    if (postMatch) return setLastmod(item, posts.find((p) => p.id === postMatch[1])?.date);

    const catMatch = path.match(/^\/categories\/([^/]+)\/$/);
    if (catMatch) return setLastmod(item, latest(posts.filter((p) => p.category && termSlug(p.category) === catMatch[1])));

    if (["/", "/blog/", "/categories/", "/tags/"].includes(path)) return setLastmod(item, latest(posts));

    // about, contact, privacy에는 lastmod를 넣지 않는다
    return item;
  },
};

export default defineConfig({
  site: SITE,
  trailingSlash: "ignore",
  integrations: [sitemap(sitemapOptions)],
  markdown: {
    shikiConfig: { themes: { light: "github-light", dark: "github-dark" } },
    // Astro 7 기본 처리기(Sätteri)에 본문 이미지 크기·지연 로딩 플러그인을 붙인다
    // smartPunctuation 끔: 한글 문장에서 여는 작은따옴표가 ’로 뒤집히고, 제목의 --windowed 같은 옵션이 –(엔 대시)로 바뀌는 문제 때문
    processor: satteri({ hastPlugins: [imgAttrsPlugin], features: { smartPunctuation: false } }),
  },
});

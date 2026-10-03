import { getCollection, type CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"blog">;

/** 공개된 글을 최신순으로. 로컬 미리보기(npm run dev)에서는 draft 글도 보여 준다. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection("blog", ({ data }) => import.meta.env.DEV || !data.draft);
  // 같은 날짜 글은 파일 이름 순으로 고정해서 빌드마다 순서(이전/다음 글)가 바뀌지 않게 한다
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf() || a.id.localeCompare(b.id));
}

export function postUrl(post: Post) {
  return `/blog/${post.id}/`;
}

/**
 * 날짜를 한국 시간(+09:00) ISO 문자열로. frontmatter에 날짜만 적은 글(2026-10-04)은 그날 0시(KST)로,
 * 시간까지 적은 글은 그 시각을 한국 시간으로 바꿔 표기한다. 메타 태그와 구조화 데이터에 쓴다.
 */
export function isoKst(date: Date) {
  const dateOnly = date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0 && date.getUTCMilliseconds() === 0;
  if (dateOnly) return `${date.toISOString().slice(0, 10)}T00:00:00+09:00`;
  return `${new Date(date.valueOf() + 9 * 3600 * 1000).toISOString().slice(0, 19)}+09:00`;
}

export function formatDate(date: Date) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

/** 한글 기준 분당 약 500자로 읽는 시간 계산 */
export function readingMinutes(body: string | undefined) {
  const chars = (body ?? "").replace(/\s+/g, "").length;
  return Math.max(1, Math.round(chars / 500));
}

export function countBy(posts: Post[], pick: (p: Post) => string[]) {
  const counts = new Map<string, number>();
  for (const post of posts) for (const key of pick(post)) counts.set(key, (counts.get(key) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"));
}

/** 설명문을 검색 결과에 맞게 약 150자로 자른다 */
export function summary(text: string, max = 150) {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/** 카테고리·태그 이름을 주소에 쓸 형태로 (공백 → 하이픈) */
export function termSlug(name: string) {
  return name.trim().replace(/\s+/g, "-");
}

export const categoryUrl = (name: string) => `/categories/${encodeURIComponent(termSlug(name))}/`;
export const tagUrl = (name: string) => `/tags/${encodeURIComponent(termSlug(name))}/`;

import { getCollection, type CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"blog">;

/** 공개된 글을 최신순으로 */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function postUrl(post: Post) {
  return `/blog/${post.id}/`;
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

/** 카테고리·태그 이름을 주소에 쓸 형태로 (공백 → 하이픈) */
export function termSlug(name: string) {
  return name.trim().replace(/\s+/g, "-");
}

export const categoryUrl = (name: string) => `/categories/${encodeURIComponent(termSlug(name))}/`;
export const tagUrl = (name: string) => `/tags/${encodeURIComponent(termSlug(name))}/`;

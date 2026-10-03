import type { APIRoute } from "astro";
import { getPosts, postUrl, formatDate } from "../lib/posts";

// 검색 페이지가 받아 쓰는 글 목록. 본문은 마크다운 기호를 걷어낸 글자만 넣는다.
export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const items = posts.map((post) => ({
    title: post.data.title,
    description: post.data.description,
    url: postUrl(post),
    date: formatDate(post.data.pubDate),
    category: post.data.category,
    tags: post.data.tags,
    body: (post.body ?? "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/<[^>]+>/g, " ")
      .replace(/[#>*_`|-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  }));
  return new Response(JSON.stringify(items), { headers: { "Content-Type": "application/json; charset=utf-8" } });
};

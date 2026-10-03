import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    // 선택: 검색 결과용 짧은 제목(<title>에만 쓰임, 본문 제목·og:title은 title 그대로)
    seoTitle: z.string().optional(),
    // 선택: 공유 미리보기용 1200x630 이미지. 없으면 cover를 쓴다.
    ogImage: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };

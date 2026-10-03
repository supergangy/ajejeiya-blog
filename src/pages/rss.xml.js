import rss from "@astrojs/rss";
import { getPosts, postUrl } from "../lib/posts";
import { SITE_TITLE, SITE_DESCRIPTION, AUTHOR, EMAIL } from "../consts";

export async function GET(context) {
  const posts = await getPosts();
  const feedUrl = new URL("/rss.xml", context.site).href;
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      categories: [post.data.category, ...post.data.tags],
      link: postUrl(post),
      // RSS 2.0의 author는 "이메일 (이름)" 형식
      author: `${EMAIL} (${AUTHOR})`,
    })),
    customData: `<language>ko</language><atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>`,
  });
}

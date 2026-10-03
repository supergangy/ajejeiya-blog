// 마크다운 본문 이미지에 width/height(레이아웃 이동 방지)와 loading="lazy", decoding="async"를 붙이는
// Sätteri(Astro 7 기본 마크다운 처리기)용 hast 플러그인. astro.config.mjs의 markdown.processor에 연결한다.
// public/ 에 있는 이미지만 크기를 읽고, 파일이 없거나 형식을 모르면 크기는 건너뛴다.
import { publicImageSize } from "./image-size.mjs";

export const imgAttrsPlugin = {
  name: "img-attrs",
  element: {
    filter: ["img"],
    /** @param {any} node @param {any} ctx */
    visit(node, ctx) {
      const props = node.properties ?? {};
      if (props.width == null && props.height == null) {
        const size = publicImageSize(typeof props.src === "string" ? props.src : "");
        if (size) {
          ctx.setProperty(node, "width", size.width);
          ctx.setProperty(node, "height", size.height);
        }
      }
      if (props.loading == null) ctx.setProperty(node, "loading", "lazy");
      if (props.decoding == null) ctx.setProperty(node, "decoding", "async");
    },
  },
};

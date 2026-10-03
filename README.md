# 종갓의 IT블로그

https://ajejeiya.cloud 의 소스입니다. [Astro](https://astro.build)로 만들고 GitHub Pages로 배포합니다.

## 글 쓰기

`src/content/blog/`에 마크다운 파일을 추가하고 `main` 브랜치에 올리면 자동으로 배포됩니다.

```md
---
title: "글 제목"
description: "목록과 검색 결과에 보이는 한두 줄 요약"
pubDate: 2026-10-03
category: "직접 만든 프로그램"
tags: ["태그1", "태그2"]
cover: "/images/폴더/대표이미지.png"   # 선택
draft: false                        # true면 공개하지 않음
---

본문...
```

이미지는 `public/images/` 아래에 넣고 `/images/...` 경로로 씁니다.

## 로컬에서 보기

```bash
npm install
npm run dev      # http://localhost:4321
```

## 광고 (Google AdSense)

승인을 받으면 `src/consts.ts`의 `ADSENSE_CLIENT`와 `ADSENSE_SLOTS`를 채우고, `public/ads.txt`를 추가합니다.

## 라이선스

글과 이미지: © 종갓. 무단 전재를 금합니다.

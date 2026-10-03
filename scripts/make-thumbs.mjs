// 목록용 작은 썸네일 만들기: public/images/<폴더>/cover.png → cover-thumb.webp (336x336)
// npm run build 직전에 자동으로 실행된다(package.json의 prebuild). 이미 있고 원본보다 새로우면 건너뛴다.
// 원본 cover.png는 건드리지 않는다(공유 미리보기 og:image는 원본을 그대로 씀).
import { readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "public/images";
const SIZE = 336; // 목록 썸네일 표시 크기 168px의 2배(고해상도 화면용)

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.warn("[make-thumbs] sharp를 불러오지 못해 썸네일 생성을 건너뜁니다. 목록은 원본 cover.png를 씁니다.");
  process.exit(0);
}

let made = 0;
for (const dir of readdirSync(ROOT, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const src = join(ROOT, dir.name, "cover.png");
  const out = join(ROOT, dir.name, "cover-thumb.webp");
  if (!existsSync(src)) continue;
  if (existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs) continue;
  try {
    await sharp(src).resize(SIZE, SIZE, { fit: "cover" }).webp({ quality: 80 }).toFile(out);
    made++;
  } catch (e) {
    console.warn(`[make-thumbs] ${src} 처리 실패: ${e.message}`);
  }
}
console.log(`[make-thumbs] 썸네일 ${made}개 생성`);

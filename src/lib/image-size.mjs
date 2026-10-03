// public/ 폴더 이미지의 가로·세로 크기를 파일 머리(헤더)만 읽어서 알아낸다.
// 빌드 때만 쓰며, 외부 라이브러리 없이 PNG·JPEG·GIF·WebP를 지원한다.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/** @type {Map<string, {width:number,height:number}|null>} */
const cache = new Map();

/**
 * @param {Buffer} b
 * @returns {{width:number,height:number}|null}
 */
export function sizeFromBuffer(b) {
  if (b.length < 30) return null;
  // PNG: IHDR 청크의 16~24바이트
  if (b.readUInt32BE(0) === 0x89504e47) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  // GIF
  if (b.toString("ascii", 0, 3) === "GIF") return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
  // WebP
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const chunk = b.toString("ascii", 12, 16);
    if (chunk === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
    if (chunk === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    if (chunk === "VP8L") {
      const bits = b.readUInt32LE(21);
      return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
    }
    return null;
  }
  // JPEG: SOF 마커를 찾는다
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
      }
      i += 2 + len;
    }
  }
  return null;
}

/**
 * "/images/x.png" 같은 사이트 경로를 받아 public/ 안의 파일 크기를 돌려준다. 파일이 없으면 null.
 * @param {string} src
 * @returns {{width:number,height:number}|null}
 */
export function publicImageSize(src) {
  if (typeof src !== "string" || !src.startsWith("/") || src.startsWith("//")) return null;
  const clean = decodeURI(src.split(/[?#]/)[0]);
  if (cache.has(clean)) return cache.get(clean) ?? null;
  const file = join(process.cwd(), "public", clean);
  let size = null;
  try {
    if (existsSync(file)) size = sizeFromBuffer(readFileSync(file));
  } catch {
    size = null;
  }
  cache.set(clean, size);
  return size;
}

/**
 * public/ 안에 파일이 있는지
 * @param {string} src
 */
export function publicFileExists(src) {
  if (typeof src !== "string" || !src.startsWith("/")) return false;
  return existsSync(join(process.cwd(), "public", decodeURI(src.split(/[?#]/)[0])));
}

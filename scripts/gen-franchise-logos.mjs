// 프랜차이즈 브랜드 아이콘 수집기 (웹·iOS 번들용) — 2026-09-12.
//
//  왜: 프랜차이즈 목록이 글자만 있어 어느 브랜드인지 한눈에 안 들어온다. 브랜드 아이콘이 있으면
//     스캔 속도가 달라진다. 다만 **흐릿한 16px 파비콘은 모노그램보다 나쁘다** → 품질 게이트를 둔다.
//
//  소스: 우리 큐레이션 데이터에 이미 있는 **공식 사이트 URL**(franchiseUrl/storeLocatorUrl).
//    검색으로 로고를 찾지 않는다 — 엉뚱한 브랜드 로고를 붙이는 게 최악이라, 출처는 브랜드 자신의 도메인만.
//    순서: apple-touch-icon → sizes 큰 icon → og:image → /favicon.ico
//
//  품질 게이트: 디코드한 실제 크기가 MIN_PX 미만이면 **버린다**(런타임이 모노그램으로 렌더).
//    PNG=IHDR, JPEG=SOF, ICO=디렉터리 최대 엔트리, SVG=벡터(무조건 통과, 여기선 저장만).
//
//  ⚠️ 상표: 로고는 각사 상표. 본 용도는 "그 브랜드의 공정위 공개 데이터를 표시"하는 지칭(nominative use)
//     범위 — 변형·보증·제휴 암시 금지. (선례: scripts/gen-inspiration-logos.cjs 의 동일 정책)
//
//  실행: node scripts/gen-franchise-logos.mjs [--limit N] [--only id1,id2]
//  출력: apps/web/public/franchise-logos/{id}.{png|svg}
//        apps/ios/Sources/FoundOneCore/Resources/flogo-{id}.{png|svg}
//        packages/shared/src/franchise-logos.json  (아이콘 보유 id → 확장자)

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WEB_DIR = join(ROOT, "apps/web/public/franchise-logos");
const IOS_DIR = join(ROOT, "apps/ios/Sources/FoundOneCore/Resources");
const MANIFEST = join(ROOT, "packages/shared/src/franchise-logos.json");

const MIN_PX = 96;          // 이보다 작으면 타일(40~44pt @3x)에서 뭉갠다 → 모노그램이 낫다
const MAX_RATIO_ICON = 3.0; // 사이트가 <link rel=icon> 으로 선언한 마크는 워드마크(가로형)여도 인정
const MAX_RATIO_OG = 1.3;   // og:image 는 홍보 배너일 확률이 높다 — 정사각에 가까울 때만 (BBQ 1920×1080 사고)
/** 불투명 픽셀 평균 휘도가 이보다 밝으면 **흰 타일에서 보이지 않는다** → 버리고 모노그램.
 *  (2026-09-12 실측: bbq 로고는 흰색 단색 SVG 라 휘도 1.0 — 타일이 빈칸으로 보였다) */
const MAX_MEAN_LUMINANCE = 0.9;
/** 그려지는 픽셀이 이보다 적으면 빈 이미지로 본다. */
const MIN_OPAQUE_RATIO = 0.02;
const TIMEOUT_MS = 12_000;
const UA = "Mozilla/5.0 (compatible; foundone-logo-bot/1.0; +https://found.one)";

const args = process.argv.slice(2);
const limit = Number(args[args.indexOf("--limit") + 1]) || Infinity;
const only = args.includes("--only") ? new Set(args[args.indexOf("--only") + 1].split(",")) : null;

function log(...a) { console.log(...a); }

// SVG → PNG 256 (iOS 는 SVG 미지원이라 래스터화해서 양 플랫폼이 같은 파일을 쓴다).
//  @resvg/resvg-js 는 scripts/package.json 의 선택 의존성 — 없으면 SVG 후보를 건너뛴다.
let Resvg = null;
try {
  ({ Resvg } = await import("@resvg/resvg-js"));
} catch {
  log("· @resvg/resvg-js 없음 — SVG 아이콘은 건너뜁니다 (cd scripts && npm i)");
}
function rasterizeSvg(buf) {
  if (!Resvg) return null;
  try {
    const r = new Resvg(buf.toString("utf8"), { fitTo: { mode: "width", value: 256 }, background: "rgba(0,0,0,0)" });
    return Buffer.from(r.render().asPng());
  } catch {
    return null;
  }
}

/**
 * PNG 픽셀 통계 — 불투명 픽셀 평균 휘도/비율. 인터레이스·팔레트는 판정 불가(null) → 통과시킨다.
 * 흰색 단색 로고를 흰 타일에 올리는 사고를 막는 게 목적이라, 정확도보다 "명백한 흰색"만 잡으면 된다.
 */
function pngLuminance(buf) {
  try {
    let pos = 8, width = 0, height = 0, depth = 0, colorType = 0, interlace = 0;
    const idat = [];
    while (pos < buf.length) {
      const len = buf.readUInt32BE(pos);
      const type = buf.toString("ascii", pos + 4, pos + 8);
      const data = buf.subarray(pos + 8, pos + 8 + len);
      if (type === "IHDR") {
        width = data.readUInt32BE(0); height = data.readUInt32BE(4);
        depth = data[8]; colorType = data[9]; interlace = data[12];
      } else if (type === "IDAT") idat.push(data);
      else if (type === "IEND") break;
      pos += 12 + len;
    }
    if (!width || depth !== 8 || interlace !== 0) return null;
    const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
    if (!channels) return null;                       // 팔레트(3) 등 → 판정 생략
    const raw = inflateSync(Buffer.concat(idat));
    const stride = width * channels;
    const out = Buffer.alloc(height * stride);
    let rp = 0;
    for (let y = 0; y < height; y++) {
      const filter = raw[rp++];
      const line = raw.subarray(rp, rp + stride); rp += stride;
      const cur = out.subarray(y * stride, (y + 1) * stride);
      const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
      for (let x = 0; x < stride; x++) {
        const a = x >= channels ? cur[x - channels] : 0;
        const b = prev[x];
        const c = x >= channels ? prev[x - channels] : 0;
        let v = line[x];
        if (filter === 1) v += a;
        else if (filter === 2) v += b;
        else if (filter === 3) v += (a + b) >> 1;
        else if (filter === 4) {
          const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        }
        cur[x] = v & 0xff;
      }
    }
    let opaque = 0, lum = 0;
    const step = Math.max(1, Math.floor((width * height) / 20000)); // 최대 2만 픽셀 샘플
    for (let i = 0; i < width * height; i += step) {
      const o = i * channels;
      let r, g, b2, alpha = 255;
      if (channels === 4) { r = out[o]; g = out[o + 1]; b2 = out[o + 2]; alpha = out[o + 3]; }
      else if (channels === 3) { r = out[o]; g = out[o + 1]; b2 = out[o + 2]; }
      else if (channels === 2) { r = g = b2 = out[o]; alpha = out[o + 1]; }
      else { r = g = b2 = out[o]; }
      if (alpha < 32) continue;
      opaque++;
      lum += (0.2126 * r + 0.7152 * g + 0.0722 * b2) / 255;
    }
    const sampled = Math.ceil((width * height) / step);
    return { meanLum: opaque ? lum / opaque : 1, opaqueRatio: opaque / sampled };
  } catch {
    return null;
  }
}

async function get(url, { asText = false } = {}) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA }, signal: c.signal, redirect: "follow" });
    if (!r.ok) return null;
    return { res: r, body: asText ? await r.text() : Buffer.from(await r.arrayBuffer()) };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** 버퍼에서 이미지 실제 크기·형식 판독. 못 읽으면 null. */
function probeImage(buf) {
  if (buf.length < 16) return null;
  // PNG: 89 50 4E 47 → IHDR width/height (big endian)
  if (buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") {
    return { ext: "png", w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  // JPEG: FF D8 → SOFn 마커에서 크기
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { ext: "jpg", h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
    return null;
  }
  // ICO: 00 00 01 00 → 디렉터리에서 가장 큰 엔트리 (0 = 256)
  if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00) {
    const count = buf.readUInt16LE(4);
    let best = { w: 0, h: 0, offset: 0, size: 0 };
    for (let i = 0; i < count; i++) {
      const e = 6 + i * 16;
      if (e + 16 > buf.length) break;
      const w = buf[e] === 0 ? 256 : buf[e];
      const h = buf[e + 1] === 0 ? 256 : buf[e + 1];
      if (w > best.w) best = { w, h, offset: buf.readUInt32LE(e + 12), size: buf.readUInt32LE(e + 8) };
    }
    if (best.w === 0) return null;
    // ICO 안에 PNG 가 들어 있으면 그 PNG 를 그대로 쓴다(대부분의 고해상도 ICO)
    const inner = buf.subarray(best.offset, best.offset + best.size);
    if (inner.length > 8 && inner[0] === 0x89 && inner.toString("ascii", 1, 4) === "PNG") {
      return { ext: "png", w: best.w, h: best.h, replaceWith: inner };
    }
    return { ext: "ico", w: best.w, h: best.h }; // BMP 인코딩 ICO — iOS/웹 <img> 호환 낮아 아래에서 거른다
  }
  // SVG
  const head = buf.toString("utf8", 0, Math.min(400, buf.length)).trim();
  if (head.startsWith("<?xml") || head.includes("<svg")) return { ext: "svg", w: Infinity, h: Infinity };
  return null;
}

/** HTML 에서 아이콘 후보 URL 목록(우선순위 순). */
function iconCandidates(html, baseUrl) {
  const out = [];
  const push = (href, rank, meta = {}) => {
    if (!href) return;
    try { out.push({ url: new URL(href, baseUrl).href, rank, ...meta }); } catch { /* 잘못된 href 무시 */ }
  };
  for (const m of html.matchAll(/<link[^>]+>/gi)) {
    const tag = m[0];
    const rel = /rel=["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase() ?? "";
    if (!rel.includes("icon")) continue;
    const href = /href=["']([^"']+)["']/i.exec(tag)?.[1];
    if (!href) continue;
    const sizes = /sizes=["']([^"']+)["']/i.exec(tag)?.[1] ?? "";
    const px = Number(/(\d+)x\d+/.exec(sizes)?.[1] ?? 0);
    const isSvg = /\.svg(\?|$)/i.test(href);
    // 순위: apple-touch(대개 180px) > SVG(벡터) > 큰 sizes > 크기 미상 > og:image > favicon.ico
    //   og:image 를 아이콘 링크보다 위에 두면 홍보 배너가 로고를 이긴다(2026-09-12 BBQ 실측).
    const rank = rel.includes("apple-touch") ? 1000 + px : isSvg ? 800 : px >= 96 ? 600 + px : 300;
    push(href, rank, { kind: "icon" });
  }
  const og = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1]
    ?? /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i.exec(html)?.[1];
  push(og, 200, { kind: "og" });
  try { push(new URL("/favicon.ico", baseUrl).href, 0, { kind: "icon" }); } catch { /* noop */ }
  return out.sort((a, b) => b.rank - a.rank);
}

/** 흰 타일 위에서 실제로 "보이는" 로고인가. 판정 불가(팔레트 PNG 등)면 통과. */
function passesInkGate(pngBuf) {
  const st = pngLuminance(pngBuf);
  if (!st) return true;
  if (st.opaqueRatio < MIN_OPAQUE_RATIO) return false;
  return st.meanLum <= MAX_MEAN_LUMINANCE;
}

async function fetchBrandIcon(brand) {
  const site = brand.franchiseUrl || brand.storeLocatorUrl;
  if (!site) return { status: "no-url" };
  const page = await get(site, { asText: true });
  if (!page) return { status: "site-fail" };

  const cands = iconCandidates(page.body, page.res.url);
  const tried = new Set();
  for (const cand of cands.slice(0, 6)) {
    if (tried.has(cand.url)) continue;
    tried.add(cand.url);
    const got = await get(cand.url);
    if (!got) continue;
    const info = probeImage(got.body);
    if (!info) continue;
    if (info.ext === "ico") continue;                 // BMP ICO — 브라우저·iOS 호환 낮음
    if (info.ext === "jpg") continue;                 // PNG 로 통일 — iOS 번들 조회·투명도 처리를 단순하게
    if (info.ext === "svg") {
      const png = rasterizeSvg(got.body);
      if (!png) continue;                             // resvg 미설치 — 다음 후보로
      if (!passesInkGate(png)) continue;              // 흰색 단색 로고 — 타일에서 안 보인다
      return { status: "ok", ext: "png", buf: png, w: 256, h: 256, from: cand.url };
    }
    if (Math.min(info.w, info.h) < MIN_PX) continue;   // 품질 게이트 — 흐린 파비콘은 모노그램만 못하다
    const ratio = Math.max(info.w, info.h) / Math.min(info.w, info.h);
    if (ratio > (cand.kind === "og" ? MAX_RATIO_OG : MAX_RATIO_ICON)) continue; // 배너·스크린샷 배제
    const buf = info.replaceWith ?? got.body;
    if (!passesInkGate(buf)) continue;                // 너무 밝거나 사실상 빈 이미지
    return { status: "ok", ext: "png", buf, w: info.w, h: info.h, from: cand.url };
  }
  return { status: "too-small-or-none" };
}

async function main() {
  const brands = JSON.parse(readFileSync(join(ROOT, "packages/shared/src/franchise-brands.json"), "utf8"));
  const targets = brands
    .filter((b) => (only ? only.has(b.id) : true))
    .filter((b) => b.franchiseUrl || b.storeLocatorUrl)
    .slice(0, limit);

  mkdirSync(WEB_DIR, { recursive: true });
  mkdirSync(IOS_DIR, { recursive: true });

  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
  const stats = { ok: 0, skipped: 0, failed: 0 };

  for (const b of targets) {
    const r = await fetchBrandIcon(b);
    if (r.status === "ok") {
      writeFileSync(join(WEB_DIR, `${b.id}.${r.ext}`), r.buf);
      writeFileSync(join(IOS_DIR, `flogo-${b.id}.${r.ext}`), r.buf);
      manifest[b.id] = r.ext;
      stats.ok++;
      log(`✓ ${b.name.ko} — ${r.w}×${r.h} ${r.ext}`);
    } else {
      delete manifest[b.id];
      if (r.status === "too-small-or-none") stats.skipped++; else stats.failed++;
      log(`· ${b.name.ko} — ${r.status} (모노그램 사용)`);
    }
  }

  // 이번 판정에서 탈락한 브랜드의 구 자산 제거 (게이트를 강화해도 옛 파일이 남아 있으면 화면이 안 바뀐다)
  for (const dir of [WEB_DIR, IOS_DIR]) {
    for (const f of readdirSync(dir)) {
      const m = dir === IOS_DIR ? /^flogo-(.+)\.(png|jpg)$/.exec(f) : /^(.+)\.(png|jpg)$/.exec(f);
      if (!m) continue;
      const [, id, ext] = m;
      if (manifest[id] !== ext) { try { unlinkSync(join(dir, f)); } catch { /* 무시 */ } }
    }
  }

  writeFileSync(MANIFEST, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 2) + "\n");
  log(`\n아이콘 ${stats.ok} · 품질미달/없음 ${stats.skipped} · 사이트실패 ${stats.failed} (대상 ${targets.length})`);
}

await main();

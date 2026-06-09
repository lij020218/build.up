// 창업 영감 카드 — 실제 기업 로고 PNG 생성기 (iOS 번들용).
//
//  소스: Simple Icons (CC0, SVG). iOS 는 SVG 미지원이라 빌드타임에 PNG 래스터화해 번들.
//   · packages/shared/src/inspiration-brands.json 의 iconSlug 를 읽어
//   · https://cdn.simpleicons.org/{slug}/{iconColor} (브랜드별 대비색) 를 받아
//   · @resvg/resvg-js 로 PNG(투명배경) 래스터화 →
//     apps/ios/Sources/FoundOneCore/Resources/ilogo-{slug}.png
//   · Simple Icons 에 없는 슬러그(404)는 건너뜀(글리프 fallback 유지).
//
//  ⚠️ 상표: Simple Icons SVG 는 CC0 이나 로고 자체는 각사 상표. 본 용도는 "창업 성공 사례를
//     지칭"하는 nominative use 범위. 변형·보증 암시 금지.
//
//  실행: node scripts/gen-inspiration-logos.cjs   (사전: cd scripts && npm i @resvg/resvg-js)

const fs = require("fs");
const path = require("path");
const https = require("https");
const { Resvg } = require("@resvg/resvg-js");

const ROOT = path.resolve(__dirname, "..");
const JSON_PATH = path.join(ROOT, "packages/shared/src/inspiration-brands.json");
const OUT_DIR = path.join(ROOT, "apps/ios/Sources/FoundOneCore/Resources");
const SIZE = 120; // px (≈ 36pt 타일 내부 마크 @3x 충분)

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "foundone-logo-gen" } }, (res) => {
      if (res.statusCode !== 200) { res.resume(); return resolve({ ok: false, status: res.statusCode }); }
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ ok: true, svg: d }));
    }).on("error", reject);
  });
}

// 권위 소스 jsdelivr(npm simple-icons) — cdn.simpleicons.org 보다 안정적.
//  단색 path 라 fill 을 직접 주입해 브랜드 대비색으로 래스터화.
async function fetchIcon(slug, color) {
  const r = await get(`https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${slug}.svg`);
  if (!r.ok) return r;
  const svg = r.svg.replace(/<svg /, `<svg fill="#${color}" `);
  return { ok: true, svg };
}

(async () => {
  const brands = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
  const made = [];
  const skipped = [];
  for (const b of brands) {
    if (!b.iconSlug) { skipped.push(`${b.name} (슬러그 없음)`); continue; }
    const color = (b.iconColor || "ffffff").replace(/^#/, "");
    const r = await fetchIcon(b.iconSlug, color);
    if (!r.ok) { skipped.push(`${b.name} [${b.iconSlug}] → ${r.status}`); continue; }
    try {
      const png = new Resvg(r.svg, { fitTo: { mode: "width", value: SIZE } }).render().asPng();
      fs.writeFileSync(path.join(OUT_DIR, `ilogo-${b.iconSlug}.png`), png);
      made.push(`${b.name} [${b.iconSlug}]`);
    } catch (e) {
      skipped.push(`${b.name} [${b.iconSlug}] 래스터 실패: ${e.message}`);
    }
  }
  console.log(`\n✅ 생성(${made.length}):`, made.join(", "));
  console.log(`⏭️  건너뜀(${skipped.length}):`, skipped.join(", "));
})();

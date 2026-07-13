// LP ビルド:
//   src/variants/v*.html の <!--JAPAN_MAP_SVG--> / <!--TRIP_MAP_SVG--> に SVG、<!--CORE_JS--> に core.js を注入 → public/v*.html
//   src/index-loader.html → public/index.html（バリアント数を注入）
//   src/ogp-card.html → src/ogp-built.html（OGP 画像の元）
//   src/form-url.txt があれば GOOGLE_FORM_EMBED_URL を全ページ一括置換
//     node src/build.mjs   （リポジトリルートから実行）
// 日本地図 SVG: geolonia/japanese-prefectures (MIT) https://github.com/geolonia/japanese-prefectures
// 旅程 SVG: フロントエンド完結の Mock 地図
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const src = dirname(fileURLToPath(import.meta.url));
const pub = join(src, "..", "public");

const svg = readFileSync(join(src, "japan-map.svg"), "utf8")
  .replace(/<\?xml[^>]*\?>\s*/, "")
  .trim();
const tripMapSvg = readFileSync(join(src, "trip-map.svg"), "utf8")
  .replace(/<\?xml[^>]*\?>\s*/, "")
  .trim();
const core = readFileSync(join(src, "core.js"), "utf8");

const variantFiles = readdirSync(join(src, "variants"))
  .filter((f) => /^v\d+\.html$/.test(f))
  .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
const COUNT = variantFiles.length;

const formUrlPath = join(src, "form-url.txt");
const formUrl = existsSync(formUrlPath) ? readFileSync(formUrlPath, "utf8").trim() : null;

// ── 不変契約ガード ──
// 各バリアントが core.js / ビルドの前提を満たしているか検査し、違反があれば書き込まずに落とす。
// 契約の全文は README「LP を編集するには」を参照。
function count(html, needle) {
  return html.split(needle).length - 1;
}
function checkContract(name, html) {
  const errors = [];
  if (count(html, "<!--TRIP_MAP_SVG-->") !== 1) errors.push("<!--TRIP_MAP_SVG--> はちょうど1回必要（replace は最初の1回しか置換しない）");
  if (count(html, "<!--CORE_JS-->") !== 1) errors.push("<!--CORE_JS--> はちょうど1回必要");
  for (const id of ["tripbox", "tmDay", "tmSpots", "tmKm", "tmCaption"]) {
    if (!html.includes(`id="${id}"`)) errors.push(`必須 ID #${id} がない（core.js の DOM 契約）`);
  }
  if (count(html, "GOOGLE_FORM_EMBED_URL") < 2) errors.push("GOOGLE_FORM_EMBED_URL は iframe src とフォールバックリンクの2箇所以上必要");
  if (count(html, "開発中") < 3) errors.push("COMING SOON 3カードすべてに「開発中」バッジが必要（誤認防止）");
  if (errors.length) {
    console.error(`契約違反: ${name}\n` + errors.map((e) => `  - ${e}`).join("\n"));
    process.exit(1);
  }
}

const coreJs = core.replace("__VARIANT_COUNT__", String(COUNT));
for (const f of variantFiles) {
  const raw = readFileSync(join(src, "variants", f), "utf8");
  checkContract(f, raw);
  let html = raw
    .replace("<!--JAPAN_MAP_SVG-->", () => svg)
    .replace("<!--TRIP_MAP_SVG-->", () => tripMapSvg)
    .replace("<!--CORE_JS-->", () => "<script>\n" + coreJs + "</script>");
  if (formUrl) html = html.replaceAll("GOOGLE_FORM_EMBED_URL", formUrl);
  writeFileSync(join(pub, f), html);
}

writeFileSync(
  join(pub, "index.html"),
  readFileSync(join(src, "index-loader.html"), "utf8").replace("__VARIANT_COUNT__", String(COUNT))
);

writeFileSync(
  join(src, "ogp-built.html"),
  readFileSync(join(src, "ogp-card.html"), "utf8")
    .replace("<!--JAPAN_MAP_SVG-->", () => svg)
    .replace("<!--TRIP_MAP_SVG-->", () => tripMapSvg)
);

console.log(`built: public/index.html (loader) + ${COUNT} variants (${variantFiles.join(", ")})`);
console.log(formUrl ? `Google Form URL 注入済み: ${formUrl}` : "Google Form: プレースホルダのまま（src/form-url.txt に URL を置くと一括注入）");
console.log("OGP画像の再生成: npx -y playwright@1.57.0 screenshot --viewport-size=1200,630 --wait-for-timeout=600 'file://" + join(src, "ogp-built.html") + "' public/ogp.png");

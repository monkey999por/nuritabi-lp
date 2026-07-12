// LP ビルド:
//   src/variants/v*.html の <!--JAPAN_MAP_SVG--> に地図 SVG、<!--CORE_JS--> に core.js を注入 → public/v*.html
//   src/index-loader.html → public/index.html（バリアント数を注入）
//   src/ogp-card.html → src/ogp-built.html（OGP 画像の元）
//   src/form-url.txt があれば GOOGLE_FORM_EMBED_URL を全ページ一括置換
//     node src/build.mjs   （リポジトリルートから実行）
// 地図 SVG: geolonia/japanese-prefectures (MIT) https://github.com/geolonia/japanese-prefectures
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const src = dirname(fileURLToPath(import.meta.url));
const pub = join(src, "..", "public");

const svg = readFileSync(join(src, "japan-map.svg"), "utf8")
  .replace(/<\?xml[^>]*\?>\s*/, "")
  .trim();
const core = readFileSync(join(src, "core.js"), "utf8");

const variantFiles = readdirSync(join(src, "variants"))
  .filter((f) => /^v\d+\.html$/.test(f))
  .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
const COUNT = variantFiles.length;

const formUrlPath = join(src, "form-url.txt");
const formUrl = existsSync(formUrlPath) ? readFileSync(formUrlPath, "utf8").trim() : null;

const coreJs = core.replace("__VARIANT_COUNT__", String(COUNT));
for (const f of variantFiles) {
  let html = readFileSync(join(src, "variants", f), "utf8")
    .replace("<!--JAPAN_MAP_SVG-->", () => svg)
    .replace("<!--CORE_JS-->", () => "<script>\n" + coreJs + "</script>");
  if (formUrl) html = html.replaceAll("GOOGLE_FORM_EMBED_URL", formUrl);
  writeFileSync(join(pub, f), html);
}

writeFileSync(
  join(pub, "index.html"),
  readFileSync(join(src, "index-loader.html"), "utf8").replace("__VARIANT_COUNT__", String(COUNT))
);

writeFileSync(join(src, "ogp-built.html"), readFileSync(join(src, "ogp-card.html"), "utf8").replace("<!--JAPAN_MAP_SVG-->", () => svg));

console.log(`built: public/index.html (loader) + ${COUNT} variants (${variantFiles.join(", ")})`);
console.log(formUrl ? `Google Form URL 注入済み: ${formUrl}` : "Google Form: プレースホルダのまま（src/form-url.txt に URL を置くと一括注入）");
console.log("OGP画像の再生成: npx -y playwright@1.57.0 screenshot --viewport-size=1200,630 --wait-for-timeout=600 'file://" + join(src, "ogp-built.html") + "' public/ogp.png");

// LP ビルド: lp-src.html / ogp-card.html の <!--JAPAN_MAP_SVG--> に japan-map.svg を差し込む
//   node src/build.mjs   （lp/ から実行）
// 地図 SVG: geolonia/japanese-prefectures (MIT) https://github.com/geolonia/japanese-prefectures
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const src = dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(join(src, "japan-map.svg"), "utf8")
  .replace(/<\?xml[^>]*\?>\s*/, "")
  .trim();

const inject = (file) =>
  readFileSync(join(src, file), "utf8").replace("<!--JAPAN_MAP_SVG-->", () => svg);

writeFileSync(join(src, "..", "public", "index.html"), inject("lp-src.html"));
writeFileSync(join(src, "ogp-built.html"), inject("ogp-card.html"));
console.log("built: public/index.html, src/ogp-built.html");
console.log("OGP画像の再生成: npx playwright screenshot --viewport-size=1200,630 --wait-for-timeout=600 'file://" + join(src, "ogp-built.html") + "' public/ogp.png");

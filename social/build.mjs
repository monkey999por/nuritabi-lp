// SNS カードビルダー:
//   social/cards/dayNN-*.html → social/out/dayNN-*.png
//   サイズはファイル名サフィックスで決定: -x=1600×900 / -ig(-N)=1080×1080 / -st=1080×1920
//   themes.css をインライン化し、<!--TRIP_MAP_SVG--> に src/trip-map.svg を注入。
//   パス1: public/vN.html のヒーローを social/.build/assets/vN-hero.png に撮影（グリッド系カードが参照）
//   実行: node social/build.mjs   （リポジトリルートから。playwright はスクラッチパッド等の node_modules を NODE_PATH で解決するか、npx で）
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const cardsDir = join(here, "cards");
const buildDir = join(here, ".build");
const assetsDir = join(buildDir, "assets");
const outDir = join(here, "out");
for (const d of [buildDir, assetsDir, outDir]) mkdirSync(d, { recursive: true });

// playwright はどこにあっても使えるように解決（ローカル node_modules → 環境変数 PLAYWRIGHT_DIR）
function resolvePlaywright() {
  const req = createRequire(import.meta.url);
  const candidates = [
    join(root, "node_modules", "playwright", "index.mjs"),
    process.env.PLAYWRIGHT_DIR ? join(process.env.PLAYWRIGHT_DIR, "node_modules", "playwright", "index.mjs") : null,
  ].filter(Boolean);
  for (const c of candidates) if (existsSync(c)) return import("file://" + c);
  try { return import(req.resolve("playwright")); } catch {}
  throw new Error("playwright が見つかりません。`npm i playwright` するか PLAYWRIGHT_DIR を設定してください");
}
const { chromium } = await resolvePlaywright();

const themesCss = readFileSync(join(cardsDir, "themes.css"), "utf8");
const tripMapSvg = readFileSync(join(root, "src", "trip-map.svg"), "utf8").replace(/<\?xml[^>]*\?>\s*/, "").trim();

function sizeOf(name) {
  if (/-x\.html$/.test(name)) return { w: 1600, h: 900 };
  if (/-ig(-\d+)?\.html$/.test(name)) return { w: 1080, h: 1080 };
  if (/-st\.html$/.test(name)) return { w: 1080, h: 1920 };
  throw new Error(`サイズ不明なカード名: ${name}（-x / -ig / -st を付けること）`);
}

const cards = readdirSync(cardsDir).filter((f) => f.endsWith(".html")).sort();
if (!cards.length) { console.error("cards/*.html がありません"); process.exit(1); }

const browser = await chromium.launch();
let failed = false;

// ── パス1: LPヒーローのスクショ（day04/day15 のグリッドが参照）──
const needHeroes = cards.some((f) => readFileSync(join(cardsDir, f), "utf8").includes("assets/v"));
if (needHeroes) {
  for (let v = 1; v <= 5; v++) {
    const p = await browser.newPage({ viewport: { width: 1200, height: 760 }, deviceScaleFactor: 1 });
    await p.goto(`file://${join(root, "public", `v${v}.html`)}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(4200); // 旅程再生が進んだ状態で
    await p.screenshot({ path: join(assetsDir, `v${v}-hero.png`) });
    await p.close();
  }
  console.log("pass1: v1..v5 ヒーロー撮影 OK");
}

// ── パス2: カード撮影 ──
for (const f of cards) {
  const { w, h } = sizeOf(f);
  let html = readFileSync(join(cardsDir, f), "utf8")
    .replace('<link rel="stylesheet" href="themes.css">', () => `<style>\n${themesCss}\n</style>`)
    .replaceAll("<!--TRIP_MAP_SVG-->", () => tripMapSvg);
  const built = join(buildDir, f);
  writeFileSync(built, html);

  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => { console.error(`  JSエラー ${f}: ${e.message}`); failed = true; });
  await page.goto(`file://${built}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400); // Webフォント描画待ち
  const ov = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight,
    iw: window.innerWidth, ih: window.innerHeight,
  }));
  if (ov.sw > ov.iw + 1 || ov.sh > ov.ih + 1) { console.error(`  はみ出し ${f}: ${ov.sw}x${ov.sh} > ${ov.iw}x${ov.ih}`); failed = true; }
  const png = join(outDir, f.replace(/\.html$/, ".png"));
  await page.screenshot({ path: png });
  await page.close();
  console.log(`built: out/${basename(png)} (${w}x${h})`);
}

await browser.close();
console.log(failed ? "検査NGあり" : `全 ${cards.length} 枚 OK`);
process.exit(failed ? 1 : 0);

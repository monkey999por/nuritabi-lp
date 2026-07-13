# ミチップ事前登録 LP

「ピンをつないで、旅行記録を完成させる。」をコンセプトにした、ロングドライブ向け旅程記録サービス『ミチップ』のウェイティングリスト用ランディングページです。

スポットは有名観光地から名前のない展望地・お気に入りの路肩まで、地図にピンを打てる場所ならどこでも記録できます。ピンとピンを道順の線でつなぎ、旅行単位・日単位の記録として残します。

- **開くたびに違うデザイン**: 5 の独立デザイン（`v1.html`〜`v5.html`）を `index.html` がランダムに振り分ける。`/?v=3` で特定デザインに固定。右下の「🎲 別のデザインで見る」で回遊
- **純静的サイト**（バックエンド無し・外部依存は Google Form のみ）。Cloudflare Pages で配信
- 全デザイン共通: **Mock旅程マップ再生**・スポット数/km 表示・Google Form 埋め込み・デザインシャッフル

## 5 デザイン

各バリアントは共通CSSを持たない**完全独立のHTML/CSS/JS**。テーマ固有のレイアウト・装飾・Webフォント・マイクロインタラクションを持つ。

| # | 名前 | スタイル | フォント | 主ターゲット |
|---|------|---------|---------|-------------|
| v1 | 昭和レトロ | 銭湯・ホーロー看板・観光案内板・硬券切符 | Shippori Mincho B1 + Yuji Syuku | 温泉・昭和好き |
| v2 | 旅ノート | 方眼紙・付箋・マスキングテープ・ポラロイド | Klee One | 車中泊女子・旅日記派 |
| v3 | 全ツッコミ | 漫画コマ割り・吹き出し・集中線・関西弁 | Mochiy Pop One + Yusei Magic | ネタ好き・話題化 |
| v4 | 高速道路標識 | 緑看板・出口標識・SA/PA予告・料金所 | Overpass + Zen Kaku Gothic New | ドライバー直球 |
| v5 | 走行ログHUD | ターミナル・計器盤・CHANGELOG・タイプライター | IBM Plex Mono + IBM Plex Sans JP | エンジニア・個人開発 |

```
public/index.html      ← ローダー（ランダム振り分け + OGP メタ）※生成物
public/v1..v5.html    ← 各デザイン（ビルド済み・自己完結）※生成物
public/ogp.png         ← X カード用 OGP 画像（1200×630）
src/variants/vN.html   ← 各デザインの編集用ソース
src/core.js            ← 全デザイン共通 JS（旅程再生/スポット数/km表示/🎲シャッフル）
src/index-loader.html  ← ローダーのソース
src/japan-map.svg      ← 日本地図 SVG（geolonia/japanese-prefectures, MIT）
src/trip-map.svg       ← Mock旅程 SVG（5日間・15スポット・フロントエンド完結）
src/ogp-card.html      ← OGP 画像の元 HTML
src/build.mjs          ← SVG + core.js を注入して public/ を生成
docs/google-form.md    ← フォーム設計＋作成・埋め込み手順
docs/social-content.md ← X/Instagram 投稿文＋2週間運用スケジュール
```

## 「この先の機能」セクション

各デザインの使い方セクションの後に、開発中機能（**みんなの旅=SNS / 旅のカレンダー / 旅程の共有**）の CSS モック付きショーケースがある。実装済み機能と誤認させないよう「開発中」バッジを常に付けること。

## 公開手順

1. **Google Form 作成** — [docs/google-form.md](docs/google-form.md) の設問どおり作成し、回答をスプレッドシートに連携
2. **フォーム URL 差し込み** — フォームの「送信→`<>`埋め込む」の URL を `src/form-url.txt` に 1 行で保存 → `node src/build.mjs`（全ページに一括注入される）→ commit & push。URL 未注入のプレビューでは iframe の代わりに「フォーム準備中」の表示が出る
3. **Cloudflare Pages にデプロイ** — ダッシュボード → Workers & Pages → Create → Pages → **Connect to Git** でこのリポジトリを選択。**Production branch: `develop`** / Build command: なし / Build output directory: **`public`**。以後 push のたびに自動デプロイ
   - CLI 派なら: `npx wrangler pages deploy public --project-name=michip-lp`

## 公開前チェックリスト

- [ ] `src/form-url.txt` に実フォーム URL を置いて再ビルド済み（`public/*.html` に GOOGLE_FORM_EMBED_URL が残っていないこと）
- [ ] フッターの X リンクを実アカウント URL に置換して再ビルド
- [ ] カスタムドメインを使う場合: `og:url` / `og:image` のドメインを差し替え（`src/index-loader.html` と各バリアントの head）
- [ ] スマホ実機で: ランダム振り分け → Mock旅程マップ再生 → 🎲シャッフル / フォーム送信 / 横スクロールが無いこと
- [ ] （任意）サービス名がミチップになったため、リポジトリ名 nuritabi-lp / Pages プロジェクト名の変更を検討（URL が変わる点に注意）
- [ ] X に URL を貼って OGP カードが出ること（反映に数分かかることがある）
- [ ] [docs/social-content.md](docs/social-content.md) の `(URL)` を実 URL に置換して予約投稿を仕込む

## LP を編集するには

```bash
node src/build.mjs   # public/index.html + v1..v5 を再生成
# OGP 画像を変えた場合のみ:
npx -y playwright@1.57.0 screenshot --viewport-size=1200,630 --wait-for-timeout=600 src/ogp-built.html public/ogp.png
```

- 文言・デザインは `src/variants/vN.html` を編集（`public/` は生成物なので直接編集しない）
- 機能（旅程再生/スポット数/km表示/シャッフル/reveal/フォーム未注入フォールバック）は `src/core.js`
- デザインを増やす: `src/variants/v6.html` を置いてビルドするだけ（ローダーとシャッフルは台数を自動検出）

### バリアントが守る契約（build.mjs が検査して違反なら fail する）

- `<!--TRIP_MAP_SVG-->` を `#tripbox` 内に、`<!--CORE_JS-->` を `</body>` 直前に**ちょうど1回**
- ID `tripbox / tmDay / tmSpots / tmKm / tmCaption` が存在
- `GOOGLE_FORM_EMBED_URL` を iframe src とフォールバックリンクの2箇所以上
- COMING SOON 3カードすべてに「開発中」バッジ（実装済みと誤認させないため）

このほか機械検査していない約束事: `#tripbox` 系に `display:none` や reveal 演出をかけない（ルート描画が壊れる）／右下16pxは🎲シャッフルボタンの領域／`prefers-reduced-motion` で全アニメ停止。

### core.js のカスタマイズフック（各バリアントの `<!--CORE_JS-->` より前の `<script>` で）

- `window.MICHIP_TM = { startCaption, finalCaption, dayCaptions, dayLabel, fallbackCaption }` — 旅程再生のキャプション文言をテーマのトーンに差し替え（v1=丁寧語 / v2=日記調 / v3=関西弁 / v4=標識調 / v5=ログ調）
- `data-reveal` 属性 — ビューポート進入で `.is-in` が付く。動き方のCSSは各バリアントが定義。`data-reveal-delay="120"` でディレイ(ms)
- CSS 変数 `--shuffle-bg / --shuffle-ink / --shuffle-border` — 🎲ボタンの配色をテーマに合わせる

## 登録者の確認

Google Form に連携したスプレッドシートを開くだけ（1行=1登録）。

## クレジット

日本地図 SVG: [geolonia/japanese-prefectures](https://github.com/geolonia/japanese-prefectures)（MIT License）

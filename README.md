# 塗り旅（ヌリタビ）事前登録 LP

「行った場所で、日本を塗れ。」— ロングドライブのための旅程×制覇記録サービス『塗り旅』のウェイティングリスト用ランディングページ。

- **開くたびに違うデザイン**: 15 の独立デザイン（`v1.html`〜`v15.html`）を `index.html` がランダムに振り分ける。`/?v=7` で特定デザインに固定（SNS でターゲット別に出し分け）。右下の「🎲 別のデザインで見る」で回遊
- **純静的サイト**（バックエンド無し・外部依存は Google Form のみ）。Cloudflare Pages で配信
- 全デザイン共通: **タップで塗れる日本地図**・塗った数で称号・**X シェア**（シェア→流入のループ）・localStorage 復元（デザインが変わっても塗りは引き継がれる）・Google Form 埋め込み

## 15 デザイン

| # | 名前 | スタイル | 主ターゲット |
|---|------|---------|-------------|
| v1 | 夜の車窓 | ダーク×行灯オレンジ | ロングドライブ勢 |
| v2 | 昭和レトロ | 銭湯・ホーロー看板 | 温泉・昭和好き |
| v3 | 旅ノート | 手書き・方眼紙 | 車中泊女子・旅日記派 |
| v4 | コミック | 漫画・コマ割り | 若年層・ノリ重視 |
| v5 | 白の展示室 | 現代アート・ギャラリー | デザイン感度高い層 |
| v6 | 全ツッコミ | お笑い・関西弁 | ネタ好き・シェア狙い |
| v7 | フルスロットル | エナジー・モータースポーツ | チャレンジ勢・走り屋 |
| v8 | ドット制覇 | RPG・レトロゲーム | ゲーマー・実績ハンター |
| v9 | 高速道路標識 | 緑看板・方面矢印 | ドライバー直球 |
| v10 | 御朱印帳 | 和紙・朱印・縦書き | 城・史跡・御朱印勢 |
| v11 | 朝の地図帳 | 教科書・白地図 | 道の駅スタンプラリー勢 |
| v12 | ステッカーポップ | 多色ステッカー | 若年層・バンライフ |
| v13 | 号外新聞 | 縦書き大見出し・段組 | 話題性・シェア狙い |
| v14 | 走行ログHUD | ターミナル・ダッシュボード | エンジニア・個人開発 |
| v15 | 硬券きっぷ | 鉄道・地紋・駅名標 | 乗り鉄・降り鉄 |

```
public/index.html      ← ローダー（ランダム振り分け + OGP メタ）※生成物
public/v1..v15.html    ← 各デザイン（ビルド済み・自己完結）※生成物
public/ogp.png         ← X カード用 OGP 画像（1200×630）
src/variants/vN.html   ← 各デザインの編集用ソース
src/core.js            ← 全デザイン共通 JS（塗り/称号/シェア/復元/🎲シャッフル）
src/index-loader.html  ← ローダーのソース
src/japan-map.svg      ← 日本地図 SVG（geolonia/japanese-prefectures, MIT）
src/ogp-card.html      ← OGP 画像の元 HTML
src/build.mjs          ← SVG + core.js を注入して public/ を生成
docs/google-form.md    ← フォーム設計＋作成・埋め込み手順
docs/social-content.md ← X/Instagram 投稿文＋2週間運用スケジュール
```

## 公開手順

1. **Google Form 作成** — [docs/google-form.md](docs/google-form.md) の設問どおり作成し、回答をスプレッドシートに連携
2. **フォーム URL 差し込み** — フォームの「送信→`<>`埋め込む」の URL を `src/form-url.txt` に 1 行で保存 → `node src/build.mjs`（全 15 ページに一括注入される）→ commit & push
3. **Cloudflare Pages にデプロイ** — ダッシュボード → Workers & Pages → Create → Pages → **Connect to Git** でこのリポジトリを選択。**Production branch: `develop`** / Build command: なし / Build output directory: **`public`**。以後 push のたびに自動デプロイ
   - CLI 派なら: `npx wrangler pages deploy public --project-name=nuritabi-lp`

## 公開前チェックリスト

- [ ] `src/form-url.txt` に実フォーム URL を置いて再ビルド済み（`public/*.html` に GOOGLE_FORM_EMBED_URL が残っていないこと）
- [ ] フッターの X リンク（各 `src/variants/vN.html` の `TODO` コメント箇所）を実アカウント URL に置換して再ビルド
- [ ] カスタムドメインを使う場合: `og:url` / `og:image` のドメインを差し替え（`src/index-loader.html` と各バリアントの head。X シェア文面の URL もこのメタから読まれる）。`nuritabi-lp.pages.dev` のまま公開するなら変更不要
- [ ] スマホ実機で: ランダム振り分け → 地図タップ→称号→X シェア / 🎲シャッフル / フォーム送信 / 横スクロールが無いこと
- [ ] X に URL を貼って OGP カードが出ること（反映に数分かかることがある）
- [ ] [docs/social-content.md](docs/social-content.md) の `(URL)` を実 URL に置換して予約投稿を仕込む（投稿ごとの推奨 `?v=N` 対応表あり）

## LP を編集するには

```bash
node src/build.mjs   # public/index.html + v1..v15 を再生成
# 検証（要 playwright）: 全デザイン共通機能 + スクリーンショット
# OGP 画像を変えた場合のみ:
npx -y playwright@1.57.0 screenshot --viewport-size=1200,630 --wait-for-timeout=600 src/ogp-built.html public/ogp.png
```

- 文言・デザインは `src/variants/vN.html` を編集（`public/` は生成物なので直接編集しない）
- 機能（塗り/称号/シェア/復元/シャッフル）は `src/core.js`。称号などの言い回しは各バリアントの `window.NURITABI_THEME` で上書き
- デザインを増やす: `src/variants/v16.html` を置いてビルドするだけ（ローダーとシャッフルは台数を自動検出）

## 登録者の確認

Google Form に連携したスプレッドシートを開くだけ（1行=1登録）。

## クレジット

日本地図 SVG: [geolonia/japanese-prefectures](https://github.com/geolonia/japanese-prefectures)（MIT License）

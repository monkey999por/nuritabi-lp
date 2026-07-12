# ミチップ事前登録 LP

「ピンをつないで、旅行記録を完成させる。」をコンセプトにした、ロングドライブ向け旅程記録サービス『ミチップ』のウェイティングリスト用ランディングページです。

スポットは有名観光地から名前のない展望地・お気に入りの路肩まで、地図にピンを打てる場所ならどこでも記録できます。ピンとピンを道順の線でつなぎ、旅行単位・日単位の記録として残します。

- **開くたびに違うデザイン**: 10 の独立デザイン（`v1.html`〜`v10.html`）を `index.html` がランダムに振り分ける。`/?v=7` で特定デザインに固定。右下の「🎲 別のデザインで見る」で回遊
- **純静的サイト**（バックエンド無し・外部依存は Google Form のみ）。Cloudflare Pages で配信
- 全デザイン共通: **Mock旅程マップ再生**・スポット数/km 表示・Google Form 埋め込み・デザインシャッフル

## 10 デザイン

| # | 名前 | スタイル | 主ターゲット |
|---|------|---------|-------------|
| v1 | 昭和レトロ | 銭湯・ホーロー看板 | 温泉・昭和好き |
| v2 | 旅ノート | 手書き・方眼紙 | 車中泊女子・旅日記派 |
| v3 | コミック | 漫画・コマ割り | 若年層・ノリ重視 |
| v4 | 全ツッコミ | お笑い・関西弁 | ネタ好き・話題化 |
| v5 | ドット制覇 | RPG・レトロゲーム | ゲーマー・ログ好き |
| v6 | 高速道路標識 | 緑看板・方面矢印 | ドライバー直球 |
| v7 | 朝の地図帳 | 教科書・白地図 | 道の駅スタンプラリー勢 |
| v8 | ステッカーポップ | 多色ステッカー | 若年層・バンライフ |
| v9 | 走行ログHUD | ターミナル・ダッシュボード | エンジニア・個人開発 |
| v10 | 硬券きっぷ | 鉄道・地紋・駅名標 | 乗り鉄・降り鉄 |

```
public/index.html      ← ローダー（ランダム振り分け + OGP メタ）※生成物
public/v1..v10.html    ← 各デザイン（ビルド済み・自己完結）※生成物
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

## 公開手順

1. **Google Form 作成** — [docs/google-form.md](docs/google-form.md) の設問どおり作成し、回答をスプレッドシートに連携
2. **フォーム URL 差し込み** — フォームの「送信→`<>`埋め込む」の URL を `src/form-url.txt` に 1 行で保存 → `node src/build.mjs`（全 10 ページに一括注入される）→ commit & push
3. **Cloudflare Pages にデプロイ** — ダッシュボード → Workers & Pages → Create → Pages → **Connect to Git** でこのリポジトリを選択。**Production branch: `develop`** / Build command: なし / Build output directory: **`public`**。以後 push のたびに自動デプロイ
   - CLI 派なら: `npx wrangler pages deploy public --project-name=michip-lp`

## 公開前チェックリスト

- [ ] `src/form-url.txt` に実フォーム URL を置いて再ビルド済み（`public/*.html` に GOOGLE_FORM_EMBED_URL が残っていないこと）
- [ ] フッターの X リンクを実アカウント URL に置換して再ビルド
- [ ] カスタムドメインを使う場合: `og:url` / `og:image` のドメインを差し替え（`src/index-loader.html` と各バリアントの head）
- [ ] スマホ実機で: ランダム振り分け → Mock旅程マップ再生 → 🎲シャッフル / フォーム送信 / 横スクロールが無いこと
- [ ] X に URL を貼って OGP カードが出ること（反映に数分かかることがある）
- [ ] [docs/social-content.md](docs/social-content.md) の `(URL)` を実 URL に置換して予約投稿を仕込む

## LP を編集するには

```bash
node src/build.mjs   # public/index.html + v1..v10 を再生成
# OGP 画像を変えた場合のみ:
npx -y playwright@1.57.0 screenshot --viewport-size=1200,630 --wait-for-timeout=600 src/ogp-built.html public/ogp.png
```

- 文言・デザインは `src/variants/vN.html` を編集（`public/` は生成物なので直接編集しない）
- 機能（旅程再生/スポット数/km表示/シャッフル）は `src/core.js`
- デザインを増やす: `src/variants/v11.html` を置いてビルドするだけ（ローダーとシャッフルは台数を自動検出）

## 登録者の確認

Google Form に連携したスプレッドシートを開くだけ（1行=1登録）。

## クレジット

日本地図 SVG: [geolonia/japanese-prefectures](https://github.com/geolonia/japanese-prefectures)（MIT License）

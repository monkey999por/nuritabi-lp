# 塗り旅（ヌリタビ）事前登録 LP

「行った場所で、日本を塗れ。」— ロングドライブのための旅程×制覇記録サービス『塗り旅』のウェイティングリスト用ランディングページ。

- **純静的サイト**（バックエンド無し・外部依存はGoogle Formのみ）。Cloudflare Pages で配信
- ヒーローの日本地図は**タップで塗れる**。塗った数で称号が付き、**結果をXでシェアできる**（シェア→流入のループ）。塗りは localStorage に保存され再訪時に復元
- 登録受付は **Google Form 埋め込み**（回答はスプレッドシートに自動蓄積）

```
public/index.html    ← 配信物（ビルド済み・自己完結）※直接編集しない
public/ogp.png       ← Xカード用 OGP 画像（1200×630）
src/lp-src.html      ← LP 編集用ソース
src/ogp-card.html    ← OGP 画像の元 HTML
src/japan-map.svg    ← 日本地図 SVG（geolonia/japanese-prefectures, MIT）
src/build.mjs        ← SVG を差し込んで public/index.html を生成
docs/google-form.md  ← フォーム設計＋作成・埋め込み手順
docs/social-content.md ← X/Instagram 投稿文＋2週間運用スケジュール
```

## 公開手順

1. **Google Form 作成** — [docs/google-form.md](docs/google-form.md) の設問どおり作成し、回答をスプレッドシートに連携
2. **フォーム URL 差し込み** — フォームの「送信→`<>`埋め込む」の URL で `src/lp-src.html` 内の `GOOGLE_FORM_EMBED_URL`（**2箇所**）を置換 → `node src/build.mjs` → commit & push
3. **Cloudflare Pages にデプロイ** — ダッシュボード → Workers & Pages → Create → Pages → **Connect to Git** でこのリポジトリを選択。Build command: **なし** / Build output directory: **`public`**。以後 push のたびに自動デプロイ
   - CLI 派なら: `npx wrangler pages deploy public --project-name=nuritabi-lp`

## 公開前チェックリスト

- [ ] `GOOGLE_FORM_EMBED_URL`（2箇所）を実フォーム URL に置換して再ビルド済み
- [ ] フッターの X リンク（`src/lp-src.html` の `TODO` コメント箇所）を実アカウント URL に置換
- [ ] カスタムドメインを使う場合: `og:url` / `og:image` のドメインを差し替え（Xシェア文面の URL もこのメタから読まれる）。`nuritabi-lp.pages.dev` のまま公開するなら変更不要
- [ ] スマホ実機で: 地図タップ→称号→Xシェア / フォーム送信 / 横スクロールが無いこと
- [ ] X に URL を貼って OGP カードが出ること（反映に数分かかることがある）
- [ ] [docs/social-content.md](docs/social-content.md) の `(URL)` を実 URL に置換して予約投稿を仕込む

## LP を編集するには

`src/lp-src.html`（LP 本体）/ `src/ogp-card.html`（OGP カード）を編集して:

```bash
node src/build.mjs   # public/index.html を再生成
# OGP 画像を変えた場合のみ（要 playwright）:
npx -y playwright@1.57.0 screenshot --viewport-size=1200,630 --wait-for-timeout=600 src/ogp-built.html public/ogp.png
```

`public/index.html` は生成物なので直接編集しない。

## 登録者の確認

Google Form に連携したスプレッドシートを開くだけ（1行=1登録）。

## クレジット

日本地図 SVG: [geolonia/japanese-prefectures](https://github.com/geolonia/japanese-prefectures)（MIT License）

### 参考
https://github.com/monkey999por/seeker

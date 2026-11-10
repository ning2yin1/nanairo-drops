# ナナイロ ドロップス

添付素材を使った縦画面のTOPと独立した準備中画面。ゲーム本体は未実装です。

## 開発・ビルド

Node.js 24 と Python 3 を使用します。外部のnpm依存はありません。

```sh
npm ci
npm run dev
npm run build
```

`dist/` が公開成果物です。すべて相対パスのため `/nanairo-drops/` で動作します。
画面の切り替えは `app.js`、準備中画面は `index.html` の `preparing-screen` と専用CSSに分離しています。
素材707×1536の座標に対してスタート画像630×204を(x=36,y=1240)に配置。
TOPは単一の`img.title-background`を`object-fit: cover`で表示します。
完成見本`design/title-reference.png`を無改変で`assets/title-complete.png`へコピーしています。
この画像にはスタートボタンも含まれるため、別画像や文字を重ねず、透明なHTMLボタンで操作します。
`title-layout.js`でcoverと同じ一様倍率・切り取り位置を計算し、タップ領域を同期します。
表示は`title.css`と`title-screen.js`へ分離。TOPだけをVisual Viewportに追従させ、
Safe Areaは背景の縮小に使わずロゴ・操作領域の位置判断に使います。
402×874では上下の金縁がほぼ残りますが、縦に短い画面では外周の切り取りが必要です。
変形、Canvas、分割描画、画像の繰り返しや背景のtransformは使用しません。

元の素材`assets/title-background.png`（707×1536）はボタンを含みません。
`assets/start-button.png`（630×204）とともに未変更で保持しています。

ゲーム画面は `data-game-touch="locked"` と `touch-action:none` でスクロール・ズームを抑制。
`game-touch.js`はiOSのgestureイベントと複数指操作、非ボタンの連続タップを画面内だけで補完します。
単指のtouchイベントは保持するため、今後のパズル操作に利用できます。
将来のマップはlocked属性を外し、`data-scroll="vertical"`でネイティブ縦スクロールに対応できます。
viewportには全ページ共通のズーム禁止を指定していません。

iOS SafariではPWAのorientation指定による回転固定は保証されません。

## 公開

`.github/workflows/pages.yml` がmainへのpushでビルドし、公式Pages Actionsで公開します。
GitHub Settings → Pages → Source は GitHub Actions に設定してください。
公開予定URL: https://ning2yin1.github.io/nanairo-drops/

## iPhone確認

Safariで公開URLを開き、画像全体・スタート→準備中→もどるの往復を確認。
共有メニューの「ホーム画面に追加」でPWAとして起動できます。
初回オンライン表示後はService Workerが素材を保存し、オフラインでも動作します。
更新時はオンラインで再表示してください。Service WorkerはHTTPキャッシュを再検証し、
新バージョンを即座に有効化して古いキャッシュを削除、クライアントを一度再読み込みします。オフライン資材の一覧を変える際は
`sw.js` のCACHE名も更新してください。

## 素材

- `assets/title-background.png`、`assets/start-button.png`: 添付PNGを無改変で使用
- `design/title-reference.png`: 添付の完成見本（ビルドには含めない）
- `assets/icon-192.png`、`assets/icon-512.png`: 背景の飴部分から生成したPWA用アイコン

## 検証

Chromiumのモバイルエミュレーションで402×874、390×844、375×667、430×932、320×568を確認。
TOP画像の範囲、画像のHTTPエラー、タップ往復、復帰後の再タップ、オフライン起動を確認します。
実機Safariの検証は別途必要です。

詳細な寸法比較と検証結果: [docs/layout-validation.md](docs/layout-validation.md)

## レイアウトの回帰テスト

PlaywrightとChromiumがあるテスト環境で、ビルド成果物を`/nanairo-drops/`として配信し、
`CHROMIUM=/path/to/chromium node scripts/check-layout.cjs`を実行できます。
Playwrightを別の場所に導入済みの場合は`PLAYWRIGHT_MODULE`でモジュールパスを指定。
`TEST_URL`でテスト先、`SCREENSHOT_DIR`でスクリーンショット出力先を変更できます。
アプリの実行とビルドにPlaywrightは不要です。

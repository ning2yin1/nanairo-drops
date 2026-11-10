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
TOPのルートはfixed + 100dvhでビューポート全体を覆います。
`title-layout.js`はロゴ・果物・飴・ボタンを一つの座標系で等倍比率のまま配置し、
`title-screen.js`がCanvasに描画します。Safe Areaと金属の縁の内側に重要部分を保持。
不足する周囲は元画像の無地のテクスチャと金属の縁のみを延長し、単色の余白を作りません。
縦向きでの利用を想定しています。

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

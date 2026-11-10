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
TOPは100dvhで画面全体を使用します。title-layout.jsが素材とボタンを同じ倍率で配置し、
果物からボタンまでをSafe Area内に保ちます。缶の装飾端は必要に応じて画面外へ逃がし、
短い画面で不足する背景はクリーム色・赤色で延長します。縦向きでの利用を想定しています。
iOS SafariではPWAのorientation指定による回転固定は保証されません。

## 公開

`.github/workflows/pages.yml` がmainへのpushでビルドし、公式Pages Actionsで公開します。
GitHub Settings → Pages → Source は GitHub Actions に設定してください。
公開予定URL: https://ning2yin1.github.io/nanairo-drops/

## iPhone確認

Safariで公開URLを開き、画像全体・スタート→準備中→もどるの往復を確認。
共有メニューの「ホーム画面に追加」でPWAとして起動できます。
初回オンライン表示後はService Workerが素材を保存し、オフラインでも動作します。
更新時はオンラインで再表示してください。オフライン資材の一覧を変える際は
`sw.js` のCACHE名も更新してください。

## 素材

- `assets/title-background.png`、`assets/start-button.png`: 添付PNGを無改変で使用
- `design/title-reference.png`: 添付の完成見本（ビルドには含めない）
- `assets/icon-192.png`、`assets/icon-512.png`: 背景の飴部分から生成したPWA用アイコン

## 検証

Chromiumのモバイルエミュレーションで402×874、390×844、375×667、430×932、320×568を確認。
TOP画像の範囲、画像のHTTPエラー、タップ往復、復帰後の再タップ、オフライン起動を確認します。
実機Safariの検証は別途必要です。

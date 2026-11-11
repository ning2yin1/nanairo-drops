# ナナイロ ドロップス

承認済み素材によるiPhone縦画面向けTOPと50ステージのスクロールマップです。
ゲーム本体は未実装で、選択可能なステージは「準備中」を表示します。

## 開発

Node.js 24とPython 3を使用。実行時の外部ライブラリはありません。

```sh
npm ci
npm run dev
npm test
npm run build
```

`npm run dev`はビルドした`dist/`を配信します。編集後は再ビルドしてください。
成果物は相対パスで動作し、GitHub Pagesの`/nanairo-drops/`にも対応します。
`.github/workflows/pages.yml`の既存設定でmainへのpushから公開します。
公開URL: https://ning2yin1.github.io/nanairo-drops/

## 承認素材

アップロード時のフォルダ構成を維持しています。

- 指示書: `nanairo-map-assets/TOP-CODEX.md`
- TOP: `nanairo-map-assets/nanairo-top-assets/`
- マップと配置JSON: `nanairo-map-assets/nanairo-map-assets/`

TOPは707×1536の共通アートボードに背景とスタート画像を載せます。
ボタンは(36,1240)、630×204。`max(W/707,H/1536)`の一様倍率で全面表示し、
必要時だけアートボード全体の上下位置を調整します。
402×874では上下の金縁が残ります。縦に短い画面では外周が切れる場合があります。
TOPの固定表示とジェスチャー制御はマップの縦スクロールから分離しています。

マップは上からmap_05→04→03→02→01。各1206×2622を幅に合わせて表示し、
各ボタン中心・エリア名・装飾はstage-positions.jsonから計算します。
数字はHTMLで中央配置し、進行状態と難易度の枠を独立して重ねます。
ヘッダー、現在地へ、設定ダイアログ、TOPへの戻る操作に対応します。
設定とステージのプレイは準備中です。

## 保存データ

調査時点では既存のセーブ実装がありませんでした。
`progress.js`は`localStorage['nanairo-drops-progress']`の`currentStage`、
`clearedStages`、`coins`を読み取ります。データがなければステージ1・コイン0。
JSONの`preview`は本番初期値に使いません。
現在の画面操作は保存内容を一切書き換えず、未解放ステージは選択できません。
準備中ダイアログを開いてもクリア・解放・コイン消費は進みません。
ほかの保存キーや保存データ内の未知のフィールドも削除しません。

## PWA

Safariの共有メニューから「ホーム画面に追加」で利用できます。
`viewport-fit=cover`、各画面の高さ追従、Safe Areaに対応。
初回オンラインで素材一式を保存すると、TOP・マップ・準備中表示はオフラインで利用できます。
ビルド時に生成する`precache.json`を使い、プレビュー画像や説明書は公開素材から除外します。
更新時は`sw.js`のCACHEと変更したモジュール/CSSの版を更新してください。
旧キャッシュの削除はアプリのキャッシュ名に限定し、localStorageには触れません。
iOSのシステムズームやSafariのブラウザUIはページから強制制御できません。

## 検証

単体テストは`npm test`。PlaywrightとChromiumがある環境では、
ビルドを`/nanairo-drops/`として配信し、次を実行できます。

```sh
CHROMIUM=/path/to/chromium node scripts/check-layout.cjs
CHROMIUM=/path/to/chromium node scripts/check-offline.cjs
```

`TEST_URL`でテスト先を、`PLAYWRIGHT_MODULE`でPlaywrightの導入先を指定できます。
`SCREENSHOT_DIR`を設定するとTOPとマップのスクリーンショットを保存します。
アプリのビルドと実行にはPlaywrightは不要です。
確認結果と制約は[検証記録](docs/layout-validation.md)、画像は[docs/screenshots/](docs/screenshots/)を参照してください。

## PWAの下端と共通ビューポート

`viewport.js`が共通ルートの高さを一元管理します。TOP/マップはその領域全体を覆い、
Safe Areaで背景やスクロール領域を縮めません。PWAでは独立した100vhプローブを画面高の基準にします。
ブラウザ版は別の100dvhプローブに追従します。
innerHeight/clientHeightが短くてもPWAの100vhを短い値で上書きしません。詳細な数値とスクリーンショットは
[PWAの下端修正記録](docs/pwa-viewport-fix.md)を参照してください。
`CHROMIUM=/path/to/chromium node scripts/check-viewport.cjs`で回帰テストを実行できます。

## iPhone内で診断する

TOPロゴを2秒長押し、またはマップの設定から「画面の診断」で開けます。
`?debugViewport=1`でも開きます。通常起動では表示しません。
[起動・コピー・背景色テストの説明](docs/viewport-diagnostics.md)を参照してください。
高さ補正は行わず、実機の数値を取得する機能です。

最新の実機計測に基づく変更は[standaloneの100vh修正](docs/standalone-height-v10.md)を参照してください。

## 独立した最小表示確認（第1段階）

既存アプリとは別経路・別インストールの表示確認ページを追加しました。
[URL・ホーム画面への追加方法・確認条件](docs/display-check-stage1.md)を参照してください。
このページでは画像・既存viewport処理・新規SW登録・オフライン対応を使用しません。
実機確認が完了するまで、第2段階のTOP追加には進みません。

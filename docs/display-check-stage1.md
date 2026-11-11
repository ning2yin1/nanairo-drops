# 第1段階：最小の表示確認ページ

## 確認URLとホーム画面への追加

https://ning2yin1.github.io/nanairo-drops/display-check/s1-b8922fb1ec2a/

1. オンラインのiPhone Safariで上記URLを開く。
2. BUILDがs1-b8922fb1ec2a、末尾がONLINE OKであることを確認する。
3. 共有メニュー→ホーム画面に追加。「表示確認 S1」という別アプリとして追加する。
   「Webアプリとして開く」の選択がある場合は有効にする。
4. Safariを離れ、ホーム画面の「表示確認 S1」から起動する。
5. standalone:true、BUILD、ONLINE OKを確認する。
6. 青い面と上下の黄色い線が、実機の画面端まで届くかを確認し、画面全体を撮影する。

既存の「ナナイロ ドロップス」を削除したり、保存データを消したりする必要はない。
追加するのは表示確認専用の別manifest/id/start_urlで、既存アプリは置き換えない。
この段階はオンライン専用。オフライン対応は最後の段階まで追加しない。

## 判定時の注意

- ONLINE OK / SW制御なし、またはONLINE OK / SW経路分離確認済みが必要。
- 「旧SWの影響あり」なら、既存アプリをオンラインで起動し、更新を待った後で確認ページを開き直す。
- 「判定不可」、ビルド違い、通常のTOPが出た場合は、表示の成功/失敗を判定しない。
- ブラウザではstandalone:false。ホーム画面から起動した結果と区別する。
- 色が画面下部と似ているだけでは成功としない。黄色の下端線の位置を確認する。
- 寸法の計算結果だけでは全面表示成功としない。

## 最小構成

- HTML内のviewport/meta、単色の面、上下の目印、ビルド識別、寸法表示だけ。
- html/body: margin/padding 0、height 100%。面: position fixed / inset 0。
- JavaScriptは寸法の読み取りとオンライン/ビルド/SW経路の確認だけ。
- 画像、アプリのTOP/マップ、viewport.js、診断ダイアログ、独自の倍率/高さ補正は使わない。
- 100vh/100dvhによる高さ指定や47px加算はない。Safe Areaは文字ラベルにだけ使用。
- 背後のhtml/bodyは暗色とし、青い面の外に領域が残れば見分けられるようにする。
- manifestに画像/アイコンやService Workerは追加しない。iPhoneのホーム画面追加を使用する。

## 既存Service Workerの影響を避ける構成

確認ページは既存SWの/nanairo-drops/ scope内にある。
既存SWに追加したのは/display-check/配下だけのnetwork-only経路。
この経路ではCache Storageの読み取り/書き込み、オフライン時のアプリHTMLへのfallbackをしない。
network-only応答の識別ヘッダーを付け、確認ページが実際の分離を検査する。
旧SWが制御していて識別ヘッダーがない場合は判定不可にする。

HTML/manifestに対応するソースハッシュをURLのディレクトリ名にし、古い版と同じURLを再利用しない。
毎起動でnonce付きfresh.jsonをcache:no-storeで取得し、BUILDと経路を検証する。
このページ自身はSWを登録/更新/解除しない。既存アプリのSW登録は既存アプリ側のまま。
確認ページはゲームのprecache.jsonに含めない。
既存キャッシュやlocalStorageの一括削除処理は追加/実行していない。

## 比較調査

同じiPhoneで正常動作する別PWAのソースは提供されていないため、比較は未実施。
この最小ページも実機ではまだ正常と確認できていない。正常な比較元として扱わない。

既存アプリと最小ページの違いは、既存アプリの共通viewport.jsによる高さ設定、TOP/マップの
各種CSS・JavaScript、通常のオフラインcache経路が、最小ページにはないこと。
viewport/metaの基本宣言はwidth=device-width, initial-scale=1, viewport-fit=cover、
apple-mobile-web-app-capable=yes、status-bar-style=black-translucentと明記している。
manifestは表示確認専用の新しいid/scope/start_urlで、ゲーム用のものを使用しない。

## 開発側の検証と変更範囲

Chromiumの390×844で上下のマーカー、リサイズ後759pxでの追従、初期scale=1を確認。
standaloneはnavigatorフラグを模擬した検証であり、実機iOSによる確認ではない。
確認ページ単独ではService Workerの登録数が0のままであることを確認。
既存SWがある条件では、故意に置いた古い確認HTMLを無視してnetwork-onlyで表示すること、
オフラインでゲームへfallbackしないこと、ゲーム自体のオフライン表示と保存項目が保たれることを確認。
既存ゲームの現在のキャッシュ・無関係のキャッシュ・保存項目も保持。

- display-check/index.html / manifest.webmanifest: 新しい最小ページ。
- scripts/build.mjs: 別経路へ出力。ゲームのprecache生成後に出力して混入を防ぐ。
- sw.js: 新経路だけnetwork-onlyへ分離。ゲームのCACHE名とその他の経路処理は維持。
- scripts/check-display-stage1.cjs: 最小構成・SW・保存項目の検証。
- docs/screenshots/stage1-*.png: 開発環境の確認画像。実機画像ではない。

## 次の段階

第1段階の実機スクリーンショットと寸法を受け取るまで停止する。
TOP追加・マップ追加・オフライン対応はまだ行わない。

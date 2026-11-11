# PWA下端の背景欠け修正（2026-11-11）

## 調査範囲と実測の区別

この依頼では添付スクリーンショットを受信できておらず、実機iPhone/Safariには接続していない。
以下の数値はChromiumで取得したDOM寸法。PWA条件はnavigator.standaloneを模擬し、
visualViewport.heightが34px短い条件を明示的に注入した再現試験である。
実機の値として報告するものではない。

## 確認した原因

html/bodyのmargin/paddingは0、heightは100%。共通mainは100dvh。
一方、title-screen.jsとmap.jsが各画面にvisualViewport.heightをpxで直接設定していた。
共通ルートと画面の高さの基準が違い、visual viewportだけ短く報告されると、
画面の下に共通背景色#f2e5ceが露出する構造だった。

| 再現条件 | innerHeight | clientHeight | visualViewport.height | main下端 | TOP/マップ下端 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 修正前・PWA相当 |874|874|840|874|840|
| 修正後・PWA相当 |874|874|840|874|874|
| 修正後・ブラウザ相当 |874|874|874|874|874|
| 修正後・短いブラウザ |759|759|759|759|759|

34pxは再現試験の入力値であり、実装へ足し引きする固定値ではない。
セーフエリアの二重減算、ツールバー高の固定減算、TOPのmax-heightは見つからなかった。
別途、map-scrollにsafe-area-inset-bottomのpaddingがあり、末尾に画像のない領域を作っていた。
このpaddingはクリーム色の直接原因ではないが、背景を末端まで連続させるため撤去した。

## 修正

- viewport.jsで共通mainの高さを一元管理。
- standalone判定はdisplay-mode:standaloneまたはiOSのnavigator.standalone。
- PWAではinnerHeight/clientHeight/100dvhの実測の最大値を採用し、短いvisual viewportで背景を縮めない。
- ブラウザではCSSの100dvh実測を使用し、ツールバーによる領域変化へ追従。未対応時は100vh/innerHeightにフォールバック。
- 両画面はposition:absolute;inset:0でmain全体を覆う。個別のpx高さや100dvh指定は撤去。
- resize、orientationchange、pageshow、表示復帰、CSS viewport寸法変化を監視。起動時の高さを固定しない。
- Safe Areaはヘッダー上部・現在地へボタン・TOPのボタン位置判断に使用。背景/マップの高さから引かない。
- マップ末尾のpadding-bottomを0にし、最下段画像をスクロール領域の下端まで表示。
- 元画像、縦横比、ステージ座標、進行データ、Pages設定は変更していない。
- CSS/モジュールとService Workerをv8へ更新。旧PWAの更新経路も検証する。

## 検証

scripts/check-viewport.cjsでブラウザ/PWA相当4条件、通常表示と短いvisual viewportを確認。
html/body/main/各画面/スクロール領域の下端、最後の背景画像の下端、padding/marginを記録。
高さ667pxへの変更とpageshowによる復帰も確認した。
ブラウザとPWA相当の両方で、TOPは一様cover倍率を維持し、402×874で上下の金縁が残る。
マップ末端の背景画像が画面下端まで届き、現在地へボタンはホームバー相当領域より上に配置される。
既存の3画面サイズでの50座標・接続・ネイティブスクロール・保存値保持テストと、単体テスト4件も成功。

- [修正前の計測](viewport-before.json)
- [修正後の4条件の計測](viewport-measurements.json)
- PWA相当: [TOP](screenshots/top-pwa-402x874.png) / [マップ](screenshots/map-pwa-402x874.png)
- ブラウザ相当: [TOP](screenshots/top-browser-402x874.png) / [マップ](screenshots/map-browser-402x874.png)

実機で追加確認する場合はSafari Web Inspectorのコンソールで次を実行できる。

```js
const viewport = await import('./viewport.js?v=8');
console.log(viewport.viewportDiagnostics());
```

これにより実機のモード・3種の高さ・CSS100dvh・各コンテナの上下端・下余白を取得できる。
実機PWA/Safariの最終確認は未実施。OSがWebページ外に描画する領域はこのDOM計測の対象外。

旧v7→v8の更新後にも、短いvisual viewportのPWA相当条件で画面高874を維持し、
オフラインでマップを開けることを確認した。保存済みの進行・コイン・未知のフィールドは不変。

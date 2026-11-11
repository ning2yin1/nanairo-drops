# 実機計測に基づくstandaloneの高さ修正（v10）

## ユーザーから提供された実機値

screen 390×844、visualViewport.scale 0.5、innerWidth 780。
innerHeight/clientHeight/100dvh/mainは1594、100vh/100lvhは約1688。

| 値 | DOM CSS px | scale 0.5での画面CSS px |
| --- | ---: | ---: |
| 旧main / 100dvh |1594|797|
| 実測100vh |1688|844|

以前のprobeはheight:100vhの後にheight:100dvhを書いており、100dvhしか測っていなかった。
standaloneのMath.maxも同じ1594の候補だけで、100vh=1688が採用されない構造だった。
これは提供された下端の差47（844−797）と整合する。

## 変更

- viewport.jsで100vh/100dvhを別の要素として測定する。
- standaloneでは100vh、ブラウザでは100dvhを基準に--app-heightを設定する。
- styles.cssのCSSフォールバックもstandalone=100vh、ブラウザ=100dvhで揃える。
- innerHeight等とのMath.maxでstandaloneの測定を代用しない。
- 47pxの固定加算、screen.heightの高さへの代入、画像の縦方向だけの変形は行わない。
- TOPは共通ルートの変更をResizeObserverで受け取り、同じアートボード内の背景/ボタンを等比再計算する。
- マップも共通ルートの下端まで拡張。Safe Areaはヘッダー/ボタンの配置にだけ使用する。
- 画像・ステージJSON・保存処理・PWA宣言・GitHub Pages設定は変更しない。
- キャッシュとビルドをv10へ更新。

## 幅780 / scale 0.5の調査

原因は未確定。viewportメタはwidth=device-width, initial-scale=1, viewport-fit=coverのまま。
実行時にviewportを変更する処理、ページ全体へのCSS zoom/scale指定は見つからなかった。
マップのtranslateとボタンの押下用translateYは位置/反応用で、ページを0.5倍にする指定ではない。
ローカルChromiumの390px幅では、パネルを開いてもdocument.scrollWidth=390、scale=1のまま。
それだけでiOSの同じ現象を否定・確定はしない。

診断パネルを更新した。

- 開く前と直後の幅/高さ/scale、現在値、visualViewport.resize履歴を記録。
- html/body/rootのwidth/min-width/max-width/zoom/transformを記録。
- 横はみ出し要素をアプリとパネルに分け、祖先でのクリップも記録。
- パネル/内容欄/テキスト欄へmin-width:0と明示的な幅上限を設定。
  予防的な制約であり、旧パネルが原因と断定したものではない。
- screen.heightとの差は(rect.bottom−visualViewport.offsetTop)×scaleで投影してから計算。
  visual viewportの原点が画面上端に一致するという前提の参考値であることも明記。

## 検証

scripts/check-standalone-height.cjsで実機の数値を模擬した。
このテストはブラウザの読み取り値を注入する数値再現であり、実機iOSの描画結果ではない。

- vh=1688/dvh=1594/scale=.5のstandalone: main/TOP/マップ下端が1688、投影下端844、screenとの差0。
- 同条件のブラウザ: rootは100dvh=1594を採用し、PWA用の長い高さを誤って適用しない。
- TOPの比率707:1536とカバレッジ、マップのスクロール領域下端・50ステージを確認。
- パネルを開く前後のscale=.5の記録と、倍率補正した比較を確認。
- 通常の390×844ではパネル前後のscale=1、横スクロール幅390、パネルのはみ出し0。
- 402×874/375×667/390×844の既存座標・スクロール・保存値保持の回帰テストが成功。
- オフラインで診断パネル、TOP、マップの往復が成功。ビルドと診断コピー/色復元も成功。

## 実機での再確認

実機PWA/Safariの再検証は未実施。実機で解決したとは報告しない。

1. オンラインでPWAを完全終了し、ホーム画面から再起動する。
2. 診断パネルのビルドがv10-…であることを確認する。
3. TOP/マップで100vh、100dvh、main.height、scaleをコピーし、下端の状態を確認する。
4. パネルを開く前・後のscaleTimelineを比較する。開く前から.5ならその旨を確認する。
5. Safariタブでも確認し、standalone=false・heightBasis=100dvhであることを確認する。

起動方法はTOPロゴの2秒長押し、マップの設定→画面の診断、または?debugViewport=1。

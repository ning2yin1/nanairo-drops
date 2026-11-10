# 原画全体の表示を優先する修正（2026-11-11）

## 確定した原因と素材

- assets/title-background.png は707×1536、assets/start-button.png は630×204。
- 添付nanairo_top_assets.zipとバイト単位で一致し、HTMLから相対パスで参照されていた。
- 従来のobject-fit:coverとMath.maxによる倍率選択は、画面を埋める代わりに画像外周を切り取る仕様だった。
- 402×874の画面比率は約0.4600、画像比率は約0.4603。一見近いが、Safe AreaやSafariバーで利用できる領域の比率は変わる。
- 前回は外周の切り取りを許容したが、今回は上下の金縁を含む画像全体の表示を優先する。

## 変更

title-layout.jsをcontainGeometryへ置換。Safe Area内の幅/707と高さ/1536の小さい方を使用する。
画像全体の幅と高さを設定したtitle-artの中に、背景imgとボタンをまとめる。
背景imgはobject-fit:contain。位置をずらすobject-positionと--art-topを撤去。
画像分割、Canvas、background-image、background-size:cover、背景のtransformは存在しない。
上下左右の金縁を切り取らず、余白は#f2e5ceで表示。画像や縁の延長なし。
mainはviewport全体。100vh/100dvhを初期値とし、Visual Viewportへ高さを同期。
Safe Areaは全画像が収まる領域の計算に使い、rootを縮めたりpaddingを重ねたりしない。
ボタンの位置は元の(36,1240)、630×204に対応する百分率を保持する。

## 検証

`scripts/check-layout.cjs`をChromiumモバイル/タッチモードで実行した。
Safe AreaはCSS変数を注入。実機Safariではない。

- 402×874（上62/下34）、378×818（47/34）、402×759（0/0）、390×844（47/34）
- 375×667（20/0）、430×932（59/34）、320×568（20/0）、874×402（0/21）

8条件すべてでrootとTOPがviewport全体を覆い、元画像の四辺がSafe Area内にあることを確認。
402×874では画像は約358.1×778、位置(約22,62)。画像比率707:1536を維持。
背景画像数1、Canvas数0、object-fit:contain、背景transform:none。
上下の金縁を含むスクリーンショットを目視確認。余白は意図したクリーム色。
不要な文書スクロールなし、HTTPエラーなし、スタート/戻る/再操作成功。
ピンチイン/アウト、ダブルタップの後もvisualViewport.scale=1。
表示高さを60px変化させて戻すテストも成功。

旧v4のService Workerを登録したクライアントでv5へ更新し、旧キャッシュ削除と、
オフライン再読み込み後のcontain表示/画面往復を確認。
アセットの内容は無改変。CSS/モジュールURLとキャッシュ名のみv5へ更新。

## 制約

画像全体を表示するので、画面比率の差とSafe Areaに応じて余白が生じる。これは意図した仕様。
実機Safari/PWAでの最終確認は未実施。iOSのシステムズームやブラウザUIは制御対象外。
公開URLへの直接通信は環境のネットワーク許可外のため未確認。

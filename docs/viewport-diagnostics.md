# iPhone PWA内の画面診断（v10）

この変更は計測用です。高さ計算・画像・座標・セーブデータは修正していません。
47 CSS pxは比較する参照値だけで、画面高に加算することはありません。

## iPhoneで開く

オンラインでPWAを完全に終了し、起動し直してください。初回の更新には素材の取得が必要です。
パネル上部のビルド番号がv10-…になっていることを確認してください。

- TOP: 「ナナイロ ドロップス」のロゴを2秒長押し。
- マップ: 歯車の「設定」→「画面の診断」。
- URLから: https://ning2yin1.github.io/nanairo-drops/?debugViewport=1

クエリなしの通常起動ではパネルは開きません。PWAの起動URLにクエリがなくても長押しと設定から開けます。
まずTOPでコピーし、閉じてマップでもコピーすると両方を比較できます。

## コピーと再計測

「診断結果をコピー」を押してください。Clipboard APIが利用できない場合は従来のコピー処理を試し、
それも使えない場合はテキストを全選択します。結果欄を長押しして手動コピーできます。
「すべて選択」も利用できます。結果欄は読み取り専用・選択可能です。
画面を回転したりアプリへ復帰したりした後は「再計測」で値を更新してください。
選択を妨げないよう自動更新は行いません。

## 下端の色の切り分け

対象をhtml→body→ルートmain→現在画面の順に選び、「背景色を変更」を押します。
マップではスクロール領域も選べます。変更する対象は一度に一つです。
折りたたむとページ下部が見やすくなります。パネルの背景以外は暗くしません。

- 帯も色が変わる: その要素の背景が帯に関係している手掛かりになります。
- どの対象でも帯が変わらない: ページ外領域などの可能性がありますが、それだけで断定はしません。

「色を元に戻す」、閉じる、Escape、ページ移動時に元のinline色指定を復元します。
高さ・画像・スクロール座標・保存データは変更せず、色の設定は保存しません。

## 収集する値

1. HTMLに埋め込んだビルド番号v10-ソースハッシュ。再ビルドでソースが変わると番号も変わります。
2. display-mode/ios standalone、devicePixelRatio。
3. screen幅/高さ、window内側の幅/高さ、documentElement.client幅/高さ。
4. visualViewportの幅/高さ/offsetTop/offsetLeft/scale。
5. env(safe-area-inset-top/bottom)のcomputed値。
6. 100vh/100svh/100lvh/100dvhのプローブ実測値と対応有無。
7. html/body/main/現在画面/map-scrollの矩形（上端・下端・高さ等）。
8. 各要素のpadding/margin全辺、height/min-height/max-height、position/box-sizing/背景色、--app-height。
9. viewport/status-bar-style/web-app-capableメタ、配信manifest、Service Workerの制御URL。
10. safe-top/bottomと、innerHeight/clientHeight/screen.heightと各下端の差が47に一致するか（±1px）。

screen.heightにはブラウザUI等が含まれる場合があります。差が47でも、それだけで補正量とは判断しません。
meta/manifestは現在の配信内容であり、iOSがホーム画面追加時に保持した設定を直接取得したものではありません。
レポートは端末内で表示し、ボタンでコピーするだけです。自動送信、Cookie/保存データの読み取りは行いません。

## 既存コードの監査結果

- 共通mainは--app-height（未設定時100dvh）、html/bodyは100%、margin/paddingは0。
- viewport.jsはPWAで独立した100vhを使用し、ブラウザは100dvhを使用。
- visualViewport.heightは既存の診断値として保持し、resize通知を監視。画面高へ直接代入していません。
- 本番画面の高さに100svhを使う処理、Safe Areaや固定ツールバー高を引く処理はありません。
- TOPのheight-safeBottomはアートボードの上下位置制約であり、画面の高さを縮める処理ではありません。
- マップのSafe Areaはヘッダー上と現在地ボタンに使用。末尾paddingは0で、二重適用は見つかりませんでした。
- viewport: width=device-width, initial-scale=1, viewport-fit=cover。
- apple-mobile-web-app-capable: yes、status-bar-style: black-translucent。
- manifest: display standalone、orientation portrait、start_url/scope ./。
- 共通背景は:rootの#f2e5ce。実機でこの背景がどこへ描かれるかは色テストと数値で確認します。

## 開発側の確認

scripts/check-viewport-debug.cjsで以下をChromiumのモバイル/PWA相当環境で確認しました。
実機iPhoneによる確認ではありません。

- クエリからの自動起動、通常起動では非表示、TOPのタッチ長押し、マップの設定経由。
- ビルド番号、全計測項目、47px比較、manifest読込。
- Clipboard API成功、コピー禁止時の選択可能なフォールバック。
- html/body/main/現在画面/map-scrollの色変更と復元、閉じる/キャンセル時の復元。
- 診断中にmainやアートボードの寸法が変わらないこと。
- オフラインPWA相当でもパネル、manifest、結果を読み込めること。
- 既存の50座標、スクロール、戻る、保存値保持の回帰テスト。

実機での数値と色テストの結果を受け取ってから、下端の修正方針を判断します。

## v10の倍率調査

100vh/100dvh/mainと、パネルを開く前・直後・再計測時のscaleを同じ結果に含めます。
visualViewportのresize履歴も最大12件保持します。横はみ出しはアプリとパネルを分け、
幅・最小幅・zoom・transform・クリップ祖先を記録します。
47px比較ではDOMの値をvisualViewport.scaleで補正してからscreen.heightと比べます。
生のDOM高さとscreen.heightは直接比較しません。パネルの幅にも明示的な上限を設けました。
倍率0.5の発生原因は実機の開く前後の計測で判断します。

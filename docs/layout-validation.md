# TOPとステージマップの確認記録（2026-11-11）

## 実装の基準

- nanairo-map-assets/TOP-CODEX.md
- nanairo-map-assets/nanairo-top-assets/ の承認済みPNG
- nanairo-map-assets/nanairo-map-assets/README.md
- 同data/stage-positions.jsonとpreviews/の位置・番号確認画像

追加素材とJSONの内容は変更していない。既存mainをfast-forwardしてから実装。
旧実装はTOP/準備中画面のみで、マップ・ゲーム・保存処理はなかった。
既存のGitHub PagesワークフローとPWAマニフェストは維持。

## 実装

TOPは背景とボタンを同じ707×1536アートボードへ配置。
ボタンの左上は(36,1240)、サイズ630×204。一様cover倍率だけを使う。
単色で埋めたり、画像を分割して延長したりしない。
金縁は402×874で残り、375×667では全面表示・非変形を優先して外周を切り取る。

マップはmap_05→04→03→02→01を縦に隙間なく並べる。
1206×2622の背景と192×192のメダルは同じ縮尺。座標はJSONのx/yを直接使用。
数字はGridの中央、1桁63px/2桁52.5px/3桁42pxを元画像倍率に合わせる。
状態は現在地→クリア済み→未解放の順に判定。難易度枠は状態と独立。
輝き・うさぎは現在地だけ。ヘッダーはマップスクロール領域の外側。
初回表示・現在地へボタンで現在地までスクロール。

新規プレイはステージ1・コイン0。previewの5・1200はテスト専用。
保存キーnanairo-drops-progressを読み取るだけで、現在の操作は書き換えを行わない。
プレイと設定は準備中ダイアログ。未解放ステージはdisabled。

## 実行済み検証

Chromiumのモバイル/タッチエミュレーション。実機Safariではない。
402×874（iPhone 17相当）、375×667、390×844で以下を確認。

- TOPと画像座標系がviewport全体を覆い、707:1536を維持。
- 背景とボタンの倍率・位置が指定座標と一致。TOP用Safe Areaを注入してボタンの可視範囲も確認。
- TOP→マップ→TOP→マップの往復。
- 50ボタンすべての中心をJSONと照合（誤差0.1 CSS px未満）。
- 5背景の順番・縦横比と4接続箇所に幾何的な隙間がないこと。
- 1桁・2桁の番号の中央、テスト用3桁100の収まり。
- タッチ操作での縦スクロール、固定ヘッダーの位置不変、現在地への復帰。
- 初期1/0、未解放49個、現在地・うさぎ・輝き各1個。
- 未解放ステージの選択不能、準備中を表示しても保存内容に変更なし。
- 保存データで現在地5、8、20を試し、ハード/スーパーハードと現在地素材が同時に表示されること。
- 保存したコイン値と不明フィールド、別の保存キーが保持されること。
- ページ/画像のHTTPエラーとJS例外なし。

npm testの4件が成功。npm run buildとgit diff --checkが成功。
/nanairo-drops/のサブパスから全素材とJSONを読み込んで検証している。
オフラインでTOP、5枚のマップ背景、50ステージ、準備中、往復操作を確認。
旧v6のPWAからv7へ更新し、旧キャッシュの削除と保存済みステージ8・コイン321・
未知のフィールド・別の保存キーを保持したままオフラインでマップが動作することを確認。
マップも上下62/34pxのSafe Areaを注入し、固定ヘッダー・現在地・下部操作が収まることを確認。

## スクリーンショット

- [TOP 402×874](screenshots/top-402x874.png)
- [新規状態のマップ 402×874](screenshots/map-402x874.png)
- [Safe Areaを注入したマップ](screenshots/map-safe-area-402x874.png)
- [照合用のステージ5状態（本番初期値ではない）](screenshots/map-preview-stage5.png)

## 制約

実機Safari/PWAでの最終確認は未実施。ゲーム本体と設定項目は未実装。
システムズームやSafariのブラウザUIはWebページから強制制御できない。

## 主な変更ファイル

- index.html / app.js: TOP→マップ、戻る、準備中・設定ダイアログ。
- title.css / title-screen.js: 承認背景と透過ボタンの共通アートボード。
- map.js / map.css: 5背景・50座標・状態/難易度/数字/UI・現在地スクロール。
- progress.js: 保存値の安全な読み取り、新規値1/0、書き換えなし。
- styles.css / game-touch.js: 共通CSS整理、縦スクロールを残すジェスチャー制御。
- sw.js / scripts/build.mjs: マップ素材込みのオフライン資材一覧とv7更新。
- package.json: ビルド済み構成の開発起動と単体テストコマンド。
- scripts/check-layout.cjs / scripts/check-offline.cjs / tests/progress.test.mjs: 回帰テスト。
- README.md / docs/layout-validation.md / docs/screenshots/: 操作・構成・確認結果と画像。

## 下端の共通レイアウト修正（v8）

最新の画面高の調査・ブラウザ/PWA相当の計測・比較画像は
[下端修正記録](pwa-viewport-fix.md)を参照。共通ルートが高さを一元管理し、
各画面独自のvisualViewport.height設定とマップ末尾のSafe Area paddingを撤去した。
v7→v8更新後のオフライン動作と保存データ保持も確認済み。

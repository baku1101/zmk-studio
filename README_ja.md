# ZMK Studio

このファイルは、この fork に加えた変更を日本語でまとめたものです。

## Fork について

このリポジトリは ZMK Studio の非公式 fork です。

upstream の ZMK Studio をベースに、キーマップ編集や behavior ヘルプを改善するためのローカル変更を含んでいます。公式版の ZMK Studio ではありません。

## この Fork での変更

- `layer-tap`、`mod-tap`、暗黙の修飾キー付きキー入力など、複雑な binding のキー表示を改善しました。
- ZMK 公式ドキュメントへのリンク付き behavior ヘルプパネルを追加しました。
- 日本語を含む behavior 説明のローカライズ対応を追加しました。
- `enc_key_press` や `Grave/Escape` など、一部未対応だった behavior 説明を追加しました。
- キーマップ編集用のキーボードショートカットを追加しました。
  - `Ctrl/Cmd+C`: 選択中の binding をコピー
  - `Ctrl/Cmd+V`: binding を貼り付け
  - `Delete` / `Backspace`: 選択中のキーを `Transparent` に変更
  - `Ctrl/Cmd+Z`、`Ctrl+Y`、`Ctrl/Cmd+Shift+Z`: undo / redo
- 矢印キーで物理レイアウト上の選択キーを移動できるようにしました。

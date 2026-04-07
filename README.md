# ZMK Studio

Initial work on the ZMK Studio UI.

## Fork Notice

This repository is an unofficial fork of ZMK Studio.

It is based on the upstream ZMK Studio project and includes local modifications for improved keymap editing and behavior help. It is not an official ZMK release.

## Changes In This Fork

- Improved key label rendering for complex bindings such as `layer-tap`, `mod-tap`, and implicit modifier key presses.
- Added a behavior help panel with links to the ZMK documentation.
- Added localized behavior help content, including Japanese descriptions for supported behaviors.
- Expanded behavior help coverage for entries such as `enc_key_press` and `Grave/Escape`.
- Added keyboard shortcuts for keymap editing:
  - `Ctrl/Cmd+C` to copy the selected binding
  - `Ctrl/Cmd+V` to paste a binding
  - `Delete` / `Backspace` to set the selected key to `Transparent`
  - `Ctrl/Cmd+Z`, `Ctrl+Y`, and `Ctrl/Cmd+Shift+Z` for undo/redo
- Added arrow-key navigation for moving the selected key across the physical layout.

For Japanese documentation, see [README_ja.md](./README_ja.md).

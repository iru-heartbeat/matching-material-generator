# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository currently contains no application code — only the phase 2 requirements
document at `docs/requirements-phase2.md`. There is no package.json, build tooling, lint
config, or test suite yet. When implementation begins, update this file with real commands
(install/dev/build/lint/test) and the actual architecture once it exists — do not guess at
them in the meantime.

## What this project is

An auto-generation tool for "matching" worksheets (マッチング教材) used in special-needs
(特別支援学級) classrooms. A teacher enters a theme; the tool generates matching pairs and
outputs a print-ready layout. Phase 1 built the original ことば×イラスト (word × illustration)
mode. Phase 2 (specified in `docs/requirements-phase2.md`) adds a mode-selection screen, two
new modes, and a hint toggle.

## Planned architecture (from the phase 2 requirements)

- **Frontend**: React, prototyped in bolt.new, implemented via Cursor + Claude Code.
- **Server**: Vercel serverless functions.
- **Persistence**: none required; use `localStorage` only if saving state is needed.
- **Word/kanji generation**: Google Gemini API (free tier).
- **Three matching modes**, chosen on a setup screen shown before theme entry (along with a
  material-wide hint on/off toggle and the existing age/pair-count settings):
  1. ことば×イラスト (existing) — theme → Gemini generates words → fetch illustration → preview → print layout.
  2. イラスト×イラスト (new) — same theme rendered in two distinct art styles (a "realistic" side and a "simple line art" side) that must be paired.
  3. イラスト×漢字 (new) — Gemini freely selects a kanji matching each illustration's meaning; it is **not** constrained by the standard grade-level kanji tables, since special-needs classrooms often don't match grade to proficiency.

### Illustration sourcing — non-obvious priority rule

This is the part most likely to be implemented wrong, so read `docs/requirements-phase2.md`
§4 before touching illustration fetching:

- **Default (all illustrations except one case below)**: call Pollinations AI first —
  `https://image.pollinations.ai/prompt/{text}`, no API key needed. The prompt must include
  style-unifying terms (e.g. "シンプルな線画", "flat illustration, simple line art, for children")
  so illustrations across a worksheet look consistent.
- **Exception — only the "realistic" side of イラスト×イラスト mode**: try Pixabay API first,
  then Iconify API (use its `prefixes` param to keep icon style consistent) if nothing found,
  and only fall back to Pollinations AI if both fail.
- If every source fails, show a "イラストが見つかりませんでした" placeholder — never leave a card empty.

## Working method

- **No browser testing by Claude.** The user tests every change in their own browser. Do not
  drive a browser, take screenshots, or otherwise verify UI behavior yourself — start the dev
  server, confirm it's running, and hand off.
- **Implement one feature at a time.** Don't batch multiple features/modes into a single pass.
  Finish and hand off one, wait for the user, then move to the next.
- **Always give the local test URL** at the end of each turn where you changed code, so the
  user can immediately check it (e.g. `http://localhost:3000` for the dev server, or the
  relevant route/page if the change is scoped to one screen, e.g.
  `http://localhost:3000/mode-select`).

## Reference

Full requirements, including the mode-selection screen spec and the fetch-order table per
mode/image-side, are in `docs/requirements-phase2.md`.

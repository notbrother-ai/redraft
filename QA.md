# RE:DRAFT playability QA — development branch

Branch: `work/playability-fix`. Production and `main` are unchanged. No files from the existing project were deleted and no history was rewritten.

## Reproduced before fixes

- A real Chromium DRAFT click repeatedly timed out; pick remained 0 and the user roster stayed empty. Competing renderers and mutation observers replaced the button DOM.
- Roster settings computed to a white/light-gray background.
- The old photo resolver accepted an unrelated first search result; the existing Jordy Nelson ID actually identified Michael Crabtree in ESPN's athlete record.
- 2017 market adjustments ran on every season, finished-room CSS overrode completion, multiple CPU timers could overlap, and year requests could overwrite newer selections.
- One 2017 market had only eight kickers for twelve teams; 2008's pool could run out of eligible bench players.

## Verified

Real Chromium tests exercised actual user DRAFT buttons and the shipping CPU scheduler, with the actual season API and stored source data.

| Season | Teams | User slot | Final pick | Result |
|---|---:|---:|---:|---|
| 2003 | 12 | 1 | 180 | Passed |
| 2008 | 12 | 12 | 180 | Passed |
| 2010 | 10 | 10 | 150 | Passed |
| 2017 | 12 | 6 | 180 | Passed |
| 2024 | 12 | 12 | 180 | Passed |
| 2026 | 12 | 1 | 180 | Passed |

Checks: all 27 years load through the season selector and API; latest year selection wins; ALL/QB/RB/WR/TE/K/DST filters and search; queue; drafted-player removal; immediate roster updates; Recent Picks; Best Available; snake order; full team roster lengths; required starters; no duplicate IDs; player-pool conservation; visible completion screen; zero uncaught JavaScript errors. The player list produced zero DOM mutations during each idle sampling window.

The actual CPU selection implementation additionally passed 324 seeded full drafts (49,788 picks) across 27 seasons, four roster configurations and three seeds. Covers 10/12 teams, two QBs, no K/DST, and no QB/TE/FLEX. The simulations use the shipping roster-limit function, including the fix that prevents disabled QB slots from receiving bench QBs. Portrait tests also cover the incorrect Jordy Nelson mapping, unknown supplied IDs, position mismatches and the two Adrian Peterson identities. Syntax and snapshot checks pass. `tests/qa-results.json` contains browser results.

## Latest room and data improvements

- Left rail is a complete chronological pick feed, with overall and round/pick numbers. Click any pick to inspect that roster; the feed follows new picks unless the user has scrolled back.
- Available Players / Draft Board tabs preserve the roster selector. The board follows snake order, highlights the current pick and user's column, and supports clicking team headers to switch rosters. Twelve columns fit the 1440px desktop layout.
- Corrected 16 clear early-year position errors using that season's NFL roster (e.g. Jamal Lewis WR→RB, Marcus Pollard WR→TE). Kept source fantasy eligibility for later hybrid players. Corrections are recorded in `data/position-corrections.json`.
- CPU quality audit: zero early backup QBs (rounds 1–9), backup TEs (1–7), early K/DST (before final three rounds), or unranked offensive picks ahead of ranked RB/WR depth below ADP 180. Full sampled first/second rounds appear in `tests/cpu-quality-results.json`; early-era rankings retain the proxy limitation below.
- Photos match stable GSIS identities through season roster/name/position/team and MFL crosswalks. Checked every published URL by downloading and decoding it, rejected shared generic NFL silhouettes and blank image responses, and decoded all 1,742 published images in Chromium. Browser replay uses the downloaded CDN bytes, with separate network checks; it is not a claim that this environment's browser reached every external CDN directly.
- Browser checks cover visible hero/row photos, lazy-loaded rows, image failure fallback, board tabs and every chronological feed number. Complete browser drafts were also repeated with the real audited image bytes routed into the browser.

## Remaining data limitations — not a full historical-accuracy sign-off

- **2000–2005 still use the inherited results-based ranking proxy. They are playable, but are NOT verified preseason ADP.** Lobby, player rows, draft profile and completion label this limitation. Draft-day grades are suppressed for those years.
- The frozen pools combine MFL, FFC and the existing FF Today archives. Source-team discrepancies and common name aliases were normalized, but every historical team assignment and preseason eligibility has not been independently verified.
- Missing depth is explicitly unranked, drawn from that season's MFL player directory. It has no observed ADP. No player is borrowed from another year's pool.
- Scoring-specific FFC values are used where present; absent splits retain the source value. Half PPR interpolates available standard/PPR splits. These are archived 12-team market snapshots, not independently sourced ADP for every custom league size.
- Portrait coverage is 7,860 of 8,696 individual player-season entries (90.4%), using 1,742 unique audited NFL identities and decoded images. All 2023, 2025 and 2026 individuals have photos. The remaining 836 entries use a deliberate silhouette/initial graphic; team defenses use labeled graphics. These are identity-matched portraits, not necessarily photographs from the selected year. Some older headshots are only 65px wide. Remote CDN availability can change; failed requests fall back once, without retry/render loops.
- Challenge/Custom modes are labeled coming soon and cannot be selected. Time Machine league settings remain configurable.

## Reproduce

- `npm ci`
- `npm run build`
- `npm test`
- `npx playwright install chromium`
- `npm run test:browser`

For a preinstalled Chromium, set `CHROMIUM_PATH`. To check a preview, set `QA_URL`. Browser tests start a local server automatically; no manual state manipulation substitutes for user picks. Source snapshots are committed under `data/seasons/`; upstream data preparation is documented in `scripts/prepare-season-snapshots.py`.

## Preview verification boundary

The branch preview builds successfully on Vercel. Its authentication redirects anonymous visitors to Vercel sign-in. The connected Vercel account could not access this project or issue a share link, so deployed browser gameplay could not be independently verified; the complete gameplay evidence above is from the local Chromium build of the same source. No authentication settings were weakened.

## Photo audit reproduction

`data/portrait-audit.json` lists coverage and every remaining fallback by season. Sources are nflverse `players.csv`, nflverse `roster_YEAR.csv` for each year 2000–2026, and dynastyprocess `db_playerids.csv`. Store them in a working directory as `players-crosswalk.csv`, `rosters/YEAR.csv`, and `fantasy-ids.csv`.

```
python scripts/match-portrait-identities.py /path/to/source-cache
python scripts/check-portrait-images.py /path/to/source-cache
python scripts/build-portrait-manifest.py /path/to/source-cache/portrait-matches.json /path/to/source-cache/portrait-cache/checks.json
PHOTO_CHECKS=/path/to/source-cache/portrait-cache/checks.json node tests/photo-browser.cjs
PHOTO_CHECKS=/path/to/source-cache/portrait-cache/checks.json npm run test:browser
```

Python image verification requires Pillow and curl. As new images are added, inspect repeated hashes and blanks before publishing the manifest; rejected placeholder hashes are versioned. The regular browser test does not require this downloaded image cache.

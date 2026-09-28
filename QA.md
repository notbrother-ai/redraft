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

The actual CPU selection implementation additionally passed 243 seeded full drafts (39,690 picks) across 27 seasons, three roster configurations and three seeds. Covers 10/12 teams, two QBs, and no K/DST. Portrait tests also cover the incorrect Jordy Nelson mapping, unknown supplied IDs, position mismatches and the two Adrian Peterson identities. Syntax and snapshot checks pass. `tests/qa-results.json` contains browser results.

## Remaining data limitations — not a full historical-accuracy sign-off

- **2000–2005 still use the inherited results-based ranking proxy. They are playable, but are NOT verified preseason ADP.** Lobby, player rows, draft profile and completion label this limitation. Draft-day grades are suppressed for those years.
- The frozen pools combine MFL, FFC and the existing FF Today archives. Source-team discrepancies and common name aliases were normalized, but every historical team assignment and preseason eligibility has not been independently verified.
- Missing depth is explicitly unranked, drawn from that season's MFL player directory. It has no observed ADP. No player is borrowed from another year's pool.
- Scoring-specific FFC values are used where present; absent splits retain the source value. Half PPR interpolates available standard/PPR splits. These are archived 12-team market snapshots, not independently sourced ADP for every custom league size.
- Portraits use a checked ESPN identity allowlist, with position and ambiguous-name guards. Unverified names and failed images use initials. These are identity-correct portraits, not necessarily photographs from the selected year.
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

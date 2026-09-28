# RE:DRAFT

Historical fantasy football draft simulator and time-machine game.

RE:DRAFT lets a user choose a past NFL fantasy season, configure a league, and draft using information that was available at the time rather than hindsight. The long-term product includes historically accurate ADP/rankings/projections, era-specific draft-room interfaces, simulation-based CPU managers, roster scouting, draft grading, and a post-draft Time Machine Reveal comparing the draft with what actually happened that season.

## Current milestone

The permanent web codebase has been created. The first production target is a polished 2017 experience, followed by additional historical seasons and interface eras.

## MVP loop

1. Choose season
2. Configure league
3. Enter an era-appropriate draft room
4. Draft against historical-market-aware CPU managers
5. Review draft grade and roster
6. Reveal actual season outcomes

## Product rule

The selected season determines the interface. There is no cosmetic theme selector: a 2017 draft should feel like a 2017 fantasy draft room, while modern seasons should use a modern interface.

## Playability development branch

See [QA.md](QA.md) for reproduced failures, browser gameplay evidence and remaining historical-data limitations. Run `npm run build`, `npm test`, and `npm run test:browser` for checks. The preview uses the original static app and API, with versioned season snapshots; no framework replacement is involved. The 2000–2005 ranking proxy is provisional and must be replaced by verified preseason data before historical-accuracy sign-off.

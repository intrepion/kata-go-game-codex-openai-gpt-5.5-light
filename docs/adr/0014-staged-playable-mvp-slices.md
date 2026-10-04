# Staged Playable MVP Slices

Implementation will be staged as board shell, rules, endgame and scoring, then overlays and persistence polish. This keeps each slice playable while preventing the visual board from drifting away from the legal game model.

## Considered Options

- One complete build
- Board shell, rules, endgame and scoring, overlays and persistence polish
- Rules engine first, UI later
- Visual board first, rules later

## Consequences

Each slice should leave the game in a browser-checkable state. Rules and UI should integrate early enough that interaction bugs are found before the final polish slice.

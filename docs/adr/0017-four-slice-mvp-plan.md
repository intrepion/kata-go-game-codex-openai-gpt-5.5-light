# Four-Slice MVP Plan

The implementation will ship in four MVP slices: static tactile board with setup and stone placement, core Go rules with captures and ko, endgame with resignation and simple area scoring, then overlays, persistence, undo, and move-list polish. This keeps every increment playable while making the riskiest Go rules visible before final polish.

## Considered Options

- One complete build
- Rules engine before visible UI
- Visual mockup before rules
- Four playable slices

## Consequences

Slice one must prove board setup and placement. Slice two must prove captures, liberties, illegal suicide, and ko. Slice three must prove two-pass end, resignation, komi, and simple area scoring. Slice four must prove teaching overlays, local persistence, full undo, and move-list polish.

# MVP Endgame and Review Boundaries

The MVP will use illegal suicide rules, automatic simple area scoring after the game ends, full move-history undo, and a visible move list without SGF import or export. This keeps local play forgiving and reviewable while avoiding dead-stone adjudication and file-format complexity before the core game is trustworthy.

## Considered Options

- Legal or configurable suicide
- Dead-stone marking before scoring
- Manual territory painting
- No undo, last-move undo, or full move-history undo
- Move list, replay controls, or SGF import/export

## Consequences

The first implementation should model full history states for undo and review. It should not present itself as supporting formal Japanese-style dead-stone adjudication or SGF workflows.

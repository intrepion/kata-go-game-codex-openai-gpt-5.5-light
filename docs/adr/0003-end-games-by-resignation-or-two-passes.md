# End Games by Resignation or Two Passes

The local Go game will end either when a player resigns or when both players pass consecutively. This preserves the normal rhythm of Go while keeping the end condition explicit and testable for the first playable version.

## Considered Options

- Two consecutive passes only
- Resignation plus two-pass scoring
- Manual scoring button only
- Timed game end

## Consequences

The game flow must treat resignation as final and must transition from the second consecutive pass into scoring without requiring a separate manual trigger.

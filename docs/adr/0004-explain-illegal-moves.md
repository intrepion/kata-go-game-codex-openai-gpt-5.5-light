# Explain Illegal Moves

Illegal moves will be rejected with visible board-level explanation rather than silent failure or generic messaging. This makes rules such as occupied intersections, ko, and illegal suicide learnable inside the game instead of making the board feel arbitrary.

## Considered Options

- Reject silently
- Reject with a short message
- Reject and visually explain the reason on the board
- Allow the move and auto-correct

## Consequences

Move validation must return reasons that the interface can present clearly. The explanation layer should not change the underlying rules.

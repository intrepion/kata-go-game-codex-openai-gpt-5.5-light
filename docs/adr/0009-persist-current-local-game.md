# Persist Current Local Game

The app will persist the current unfinished game locally so a refresh does not lose play. Finished game history, cloud save, and cross-device sync are out of scope for the MVP.

## Considered Options

- No persistence
- Persist current game locally
- Persist current game plus finished game history
- Cloud save

## Consequences

The game state must be serializable enough to restore the board, setup choices, current player, move history, captures, pass state, and scoring state on the same device.

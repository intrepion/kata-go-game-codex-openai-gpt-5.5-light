# Go Game

This context defines the language for a local browser implementation of the board game Go. It keeps the product vocabulary separate from implementation choices.

## Language

**Go Game**:
A faithful playable implementation of the board game Go for local play on one device.
_Avoid_: Go-inspired game, abstract stone game

**Board**:
The grid of intersections where players place stones. The game supports 9x9, 13x13, and 19x19 boards.
_Avoid_: Map, level, arena

**Stone**:
A black or white playing piece placed on an empty board intersection.
_Avoid_: Piece, token, disc

**Intersection**:
A point on the board grid where a stone may be placed.
_Avoid_: Cell, square, tile

**Liberty**:
An empty intersection directly adjacent to a stone or connected group of stones.
_Avoid_: Breath, life point

**Group**:
One or more same-color stones connected orthogonally through adjacent intersections.
_Avoid_: Chain, cluster

**Capture**:
The removal of an opposing group after its last liberty is filled.
_Avoid_: Kill, take

**Ko**:
The rule preventing immediate repetition of a previous board position.
_Avoid_: Loop rule, repeat ban

**Pass**:
A turn where a player places no stone and hands play to the opponent.
_Avoid_: Skip, forfeit

**Area Scoring**:
The scoring model where a player's score is based on stones on the board plus controlled empty intersections.
_Avoid_: Territory scoring, Japanese scoring

**Local Play**:
Human-versus-human play on the same device.
_Avoid_: Multiplayer, online play, hotseat

**Teaching Overlay**:
An optional visual aid that explains concepts such as liberties, captures, and controlled areas without changing game rules.
_Avoid_: Tutorial mode, hint engine

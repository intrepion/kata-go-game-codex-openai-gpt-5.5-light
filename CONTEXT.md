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

**Stone Preview**:
A temporary visual marker showing where the current player is about to place a stone before confirming the move.
_Avoid_: Cursor, ghost piece

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

**Resignation**:
A player action that immediately ends the game by conceding victory to the opponent.
_Avoid_: Quit, surrender

**Two-Pass End**:
The game-ending state reached when both players pass on consecutive turns.
_Avoid_: Manual scoring trigger, timeout

**Area Scoring**:
The scoring model where a player's score is based on stones on the board plus controlled empty intersections.
_Avoid_: Territory scoring, Japanese scoring

**Illegal Move**:
A rejected attempted move, such as playing on an occupied intersection, violating ko, or making a suicide move that captures no opposing stones.
_Avoid_: Invalid click, bad move

**Suicide Move**:
A move that would leave the placed stone's group with no liberties after captures are resolved.
_Avoid_: Self-capture, self-kill

**Score**:
The final count produced by area scoring after the game ends.
_Avoid_: Points, total

**Move History**:
The ordered record of moves, passes, captures, resignations, and undo steps in the current game.
_Avoid_: Log, transcript

**Undo**:
A local play action that restores the game to an earlier move history state.
_Avoid_: Rewind, takeback

**Move List**:
The visible sequence of moves and passes in the current game.
_Avoid_: SGF, replay

**Komi**:
Bonus score awarded to White to offset Black's first-move advantage.
_Avoid_: Bonus, handicap points

**Game Setup**:
The pre-game choices that define a new local game, limited in the MVP to board size and komi.
_Avoid_: Lobby, match settings

**Saved Game**:
The unfinished local game restored after a browser refresh on the same device.
_Avoid_: Cloud save, archive

**Local Play**:
Human-versus-human play on the same device.
_Avoid_: Multiplayer, online play, hotseat

**Teaching Overlay**:
An optional visual aid that explains concepts such as liberties, captures, and controlled areas without changing game rules.
_Avoid_: Tutorial mode, hint engine

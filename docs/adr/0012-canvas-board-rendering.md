# Canvas Board Rendering

The board will be rendered with Canvas 2D rather than an HTML grid, SVG, or WebGL. Canvas gives precise 9x9, 13x13, and 19x19 drawing with efficient overlays and a tactile visual style without depending on DOM layout for every intersection.

## Considered Options

- HTML and CSS grid
- Canvas 2D
- SVG
- WebGL or Three.js

## Consequences

Pointer-to-intersection mapping must be tested carefully, especially for 19x19 boards and responsive sizing. Board annotations such as liberties, last move, ko warnings, and area ownership should be drawn as part of the Canvas presentation.

# Dependency-Free Static Implementation

The MVP will be built as dependency-free HTML, CSS, and JavaScript rather than a TypeScript, Vite, or React app. This keeps the direct-file launch path natural, makes the rules engine easy to inspect, and avoids build tooling before the product shape is proven.

## Considered Options

- Dependency-free HTML, CSS, and JavaScript
- TypeScript with a small build step
- Vite and TypeScript with a generated direct-file bundle
- React and Vite

## Consequences

The first implementation should ship committed static files at the repo root. If future scope adds complex UI state, SGF parsing, or AI play, the project can revisit TypeScript or build tooling with a direct-file regression preserved.

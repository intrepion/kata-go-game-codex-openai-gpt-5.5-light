# Static Browser App

The first version of the Go game will be a static browser app that can run by opening `index.html` directly. This keeps the playable artifact easy to inspect and share while avoiding server infrastructure before the rules, board interaction, and scoring model are proven.

## Considered Options

- Static direct-file browser app
- Vite-only browser app
- Native desktop app
- Server-backed web app

## Consequences

The implementation must avoid relying on dev-server-only module loading for the shipped entrypoint. Any future tooling should preserve a direct-file-safe root launch path.

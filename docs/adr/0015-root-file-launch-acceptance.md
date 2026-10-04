# Root File Launch Acceptance

The MVP acceptance path is opening the root `index.html` through `file://`. Because the project is dependency-free static code, local HTTP support is useful but not required to prove the first delivery.

## Considered Options

- Root `file://` `index.html` only
- Local HTTP only
- Both root `file://` `index.html` and local HTTP
- Code checks without browser verification

## Consequences

The root page must not rely on dev-server module resolution, CDN-only code paths, or server APIs. Browser verification should exercise the exact file users can double-click.

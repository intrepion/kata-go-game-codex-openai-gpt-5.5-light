# Rule and Browser Validation

Each MVP slice should be validated with rule-engine tests and real browser smoke tests. Go rules can fail subtly in pure interaction testing, while board placement and direct-file launch can fail despite passing unit tests.

## Considered Options

- Manual browser checks only
- Rule-engine unit tests only
- Browser smoke tests plus rule-engine tests
- Full visual regression suite

## Consequences

The project should keep rules testable separately from rendering and should verify the actual root `index.html` browser path during delivery. Full visual regression is not required for the MVP.

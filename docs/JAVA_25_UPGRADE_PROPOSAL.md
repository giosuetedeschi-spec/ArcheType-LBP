# Proposal: Upgrade Backend to Java 25 (LTS)

## Current state
- `backend/pom.xml` targets Java 21 (`<java.version>21</java.version>`), on Spring Boot 3.3.0.
- Java 21 is LTS but Java 25 (released September 2025) is the newer LTS, with the next LTS not due until 2028 (Java 29 era). Staying on 21 means missing 4 years of LTS improvements while every future migration only gets harder.

## Why move now
- **Performance**: Generational ZGC (default since 21, matured since), further JIT/startup improvements, and continued work on Compact Object Headers (JEP 519, finalized in 25) reduce heap footprint — relevant for a Spring Boot service running games/session data in-memory caches (Caffeine).
- **Language ergonomics**: Stable pattern matching for `switch`, records patterns, and (finalized in 25) module import declarations and flexible constructor bodies simplify DTO/validation code in `dto/` and `exception/GlobalExceptionHandler`.
- **Structured Concurrency & Scoped Values** (finalized as of 25): directly useful if/when the backend adds concurrent calls to the Steam Web API (`scripts/steam_api.py` logic could move server-side) or parallel stat aggregation in `StatsService`.
- **Security & maintenance**: 21 stops receiving free Oracle public updates sooner than 25; 25 gives the longest runway before another forced migration.
- **Ecosystem timing**: Spring Boot 3.4+ already supports Java 25 as a baseline runtime; staying on Boot 3.3 + Java 21 now means doing two migrations later (Boot bump + Java bump) instead of one.

## What has to move together
Java bump alone isn't enough — these are coupled:
1. **Spring Boot**: bump from 3.3.0 to a 3.4.x/3.5.x line that lists Java 25 as supported.
2. **Lombok**: current `1.18.38` — verify it has a release supporting javac 25 (Lombok trails new JDKs; check compatibility table before bumping).
3. **Maven compiler plugin / toolchain**: `<release>${java.version}</release>` already reads from the property, so bumping `java.version` to `25` is mechanically a one-line change once dependencies are ready.
4. **Docker base image**: `backend/Dockerfile` (and CI images in `.github/workflows/`) need to move to a `25`-based JDK image (e.g. `eclipse-temurin:25-jdk`).
5. **CI**: GitHub Actions workflows that pin a JDK version (`actions/setup-java`) need updating alongside.

## Risk / cost
- Low code-churn risk: this is a well-typed Spring Boot 3.x codebase, not using any deprecated-for-removal APIs as of a quick scan.
- Main risk is **dependency lag**: Lombok, and any third-party libs pinned to specific bytecode versions, may not have 25-compatible releases yet at time of migration — this should be the first thing verified, not assumed.
- Low blast radius: backend is containerized and tested via `mvn test`; a CI matrix run on Java 25 before merging would catch most issues cheaply.

## Suggested next step
Spike branch: bump `java.version` to `25`, bump Spring Boot parent to latest 3.4/3.5, run `mvn test` + `docker compose up --build`, and see what breaks before committing to a full migration plan.

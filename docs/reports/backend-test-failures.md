# Backend Jest Test Failures (npm test --prefix backend)

The following failures were observed when running `npm test --prefix backend` on 2025-09-27T05:33:30Z:

## Property-Based Game Engine Tests
- `GameEngine property tests` – multiple properties failed (chip conservation, settlement balancing, double-entry, pot distribution). Each failure traces back to a two-action sequence (`next` then `fold` by `p2`) that leaves chip totals and settlements inconsistent. 【a6aa68†L1-L46】
- `pot-invariants.spec` – conservation property asserts gains equal losses but fails, indicating mismatch in pot settlements. 【02beff†L1-L19】

## Game Gateway Tests
- `GameGateway idempotency` – expected duplicate action acknowledgement is not emitted. 【b5444f†L1-L12】
- `GameGateway auth` – duplicate action acknowledgement missing, leading to undefined emitted error event. 【88bb5c†L1-L12】
- `GameGateway restart` and related suites (`reconnect`, `fuzz`, `disconnect`) – Jest cannot parse the ESM `p-queue` dependency when loading the queue implementation, and duplicate-action acknowledgement expectations fail. 【a16281†L1-L32】【955c16†L1-L120】【02beff†L19-L111】【f62153†L1-L36】

## Game Gateway Privacy & Spectator Tests
- `gateway-privacy` – collects fewer spectator state snapshots than expected (zero captured). 【64f143†L1-L10】
- `spectator.privacy` – spectator receives fewer than two state payloads. 【ec4203†L1-L22】
- `spectator.gateway.rate-limit` – emitted states include `serverTime` fields, violating strict equality expectation. 【9c65f0†L1-L16】

## Tournament Simulation
- `tournament/mega-sim` – simulated blind schedule duration deviates by more than 5% from target. 【33830e†L1-L7】

## Infrastructure / Test Harness Setup
- `game/failover.spec` – PostgreSQL Testcontainer cannot start due to nested cgroups, forcing the suite to skip cross-region failover validation. 【9d98ef†L1-L21】

## Environment Compatibility Issues
- Several suites abort because Jest cannot transform the ESM `p-queue` dependency under Node.js 20 (adjust `transformIgnorePatterns` or enable ESM). 【a16281†L1-L32】【955c16†L1-L120】【02beff†L19-L111】【f62153†L1-L36】


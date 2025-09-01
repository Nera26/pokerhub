# Chaos Utilities

Scripts for introducing failure modes in PokerHub load testing.

## reservation-stall.js

Creates seat reservations in Redis without TTL to simulate orphaned reservations.

```sh
RESERVATIONS=5 node reservation-stall.js
```

The script prints hand IDs and cleanup commands (`redis-cli del reservation:<id>`). Run the deletions after the drill.

/**
 * Basic anti-collusion detection heuristics for PokerHub.
 * These functions analyze gameplay and session data to surface
 * suspicious patterns for manual review.
 */

/**
 * Detect groups of players sharing the same IP address.
 * @param {Array<{playerId:string, ip:string}>} sessions
 * @returns {Array<{ip:string, players:string[]}>}
 */
function detectSharedIP(sessions) {
  const map = new Map();
  for (const s of sessions) {
    if (!map.has(s.ip)) map.set(s.ip, new Set());
    map.get(s.ip).add(s.playerId);
  }
  const results = [];
  for (const [ip, players] of map.entries()) {
    if (players.size > 1) {
      results.push({ ip, players: Array.from(players) });
    }
  }
  return results;
}

/**
 * Detect chip dumping between accounts over a threshold.
 * @param {Array<{from:string,to:string,amount:number}>} transfers
 * @param {number} threshold
 * @returns {Array<{from:string,to:string,total:number}>}
 */
function detectChipDumping(transfers, threshold = 100000) {
  const map = new Map();
  for (const t of transfers) {
    const key = `${t.from}->${t.to}`;
    map.set(key, (map.get(key) || 0) + t.amount);
  }
  const results = [];
  for (const [key, total] of map.entries()) {
    if (total > threshold) {
      const [from, to] = key.split("->");
      results.push({ from, to, total });
    }
  }
  return results;
}

/**
 * Detect synchronized betting where multiple players act within a
 * tight time window on the same hand.
 * @param {Array<{handId:string,playerId:string,timeMs:number}>} events
 * @param {number} windowMs
 * @returns {Array<{handId:string,players:string[]}>}
 */
function detectSynchronizedBetting(events, windowMs = 200) {
  const byHand = new Map();
  for (const e of events) {
    if (!byHand.has(e.handId)) byHand.set(e.handId, []);
    byHand.get(e.handId).push(e);
  }
  const results = [];
  for (const [handId, list] of byHand.entries()) {
    const times = list.map((e) => e.timeMs).sort((a, b) => a - b);
    if (times.length > 1 && times[times.length - 1] - times[0] <= windowMs) {
      results.push({ handId, players: list.map((e) => e.playerId) });
    }
  }
  return results;
}

module.exports = {
  detectSharedIP,
  detectChipDumping,
  detectSynchronizedBetting,
};

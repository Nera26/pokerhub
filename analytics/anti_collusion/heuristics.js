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
    const times = list.map(e => e.timeMs).sort((a, b) => a - b);
    if (times.length > 1 && times[times.length - 1] - times[0] <= windowMs) {
      results.push({ handId, players: list.map(e => e.playerId) });
    }
  }
  return results;
}

/**
 * Detect highly correlated bet sizes between players across multiple hands.
 * Uses the Pearson correlation coefficient of bet amounts on hands
 * where both players participated.
 * @param {Array<{handId:string,playerId:string,amount:number}>} bets
 * @param {number} threshold correlation threshold
 * @param {number} minHands minimum shared hands to compare
 * @returns {Array<{players:string[],correlation:number}>}
 */
function detectCorrelatedBetting(bets, threshold = 0.9, minHands = 3) {
  const byPlayer = new Map();
  for (const b of bets) {
    if (!byPlayer.has(b.playerId)) byPlayer.set(b.playerId, new Map());
    byPlayer.get(b.playerId).set(b.handId, b.amount);
  }
  const players = Array.from(byPlayer.keys());
  const results = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const p1 = players[i];
      const p2 = players[j];
      const bets1 = [];
      const bets2 = [];
      for (const [handId, amount] of byPlayer.get(p1).entries()) {
        if (byPlayer.get(p2).has(handId)) {
          bets1.push(amount);
          bets2.push(byPlayer.get(p2).get(handId));
        }
      }
      if (bets1.length >= minHands) {
        const corr = pearson(bets1, bets2);
        if (Math.abs(corr) >= threshold) {
          results.push({ players: [p1, p2], correlation: corr });
        }
      }
    }
  }
  return results;
}

function pearson(xs, ys) {
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denomX = 0;
  let denomY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  const denom = Math.sqrt(denomX * denomY);
  return denom === 0 ? 0 : num / denom;
}

/**
 * Detect players located within a small geographic distance of each other.
 * @param {Array<{playerId:string,lat:number,lon:number}>} sessions
 * @param {number} thresholdKm distance threshold in kilometers
 * @returns {Array<{players:string[],distanceKm:number}>}
 */
function detectNetworkProximity(sessions, thresholdKm = 50) {
  const results = [];
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const a = sessions[i];
      const b = sessions[j];
      const dist = haversine(a.lat, a.lon, b.lat, b.lon);
      if (dist <= thresholdKm) {
        results.push({ players: [a.playerId, b.playerId], distanceKm: dist });
      }
    }
  }
  return results;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = {
  detectSharedIP,
  detectChipDumping,
  detectSynchronizedBetting,
  detectCorrelatedBetting,
  detectNetworkProximity,
};

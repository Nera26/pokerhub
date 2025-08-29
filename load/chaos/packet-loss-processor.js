'use strict';

module.exports = { injectChaos };

function injectChaos(req, context, ee, next) {
  const delay = Math.random() * (Number(process.env.LATENCY_MS) || 1000);
  setTimeout(() => {
    const loss = Number(process.env.PACKET_LOSS || 0.1);
    if (Math.random() < loss) {
      return next(new Error('simulated packet loss'));
    }
    next();
  }, delay);
}

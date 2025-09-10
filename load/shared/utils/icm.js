function calculateIcmPayouts(stacks, prizes) {
  const raw = icmRecursive(stacks, prizes);
  const floored = raw.map(Math.floor);
  const remainder = prizes.reduce((a, b) => a + b, 0) - floored.reduce((a, b) => a + b, 0);
  const fractions = raw.map((v, i) => ({ i, frac: v - floored[i] }));
  fractions.sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < remainder; i++) {
    floored[fractions[i].i] += 1;
  }
  return floored;
}
function icmRecursive(stacks, prizes) {
  const n = stacks.length;
  if (prizes.length === 0) return new Array(n).fill(0);
  const total = stacks.reduce((a, b) => a + b, 0);
  const res = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const prob = stacks[i] / total;
    res[i] += prizes[0] * prob;
    if (prizes.length > 1) {
      const remainingStacks = stacks.filter((_, idx) => idx !== i);
      const sub = icmRecursive(remainingStacks, prizes.slice(1));
      for (let j = 0; j < sub.length; j++) {
        const idx = j >= i ? j + 1 : j;
        res[idx] += sub[j] * prob;
      }
    }
  }
  return res;
}
function icmRaw(stacks, prizes) {
  return icmRecursive(stacks, prizes);
}
export {
  calculateIcmPayouts,
  icmRaw
};

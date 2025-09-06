export function calculateIcmPayouts(stacks, prizes) {
  function icmRecursive(st, pr) {
    const n = st.length;
    if (pr.length === 0) return new Array(n).fill(0);
    const total = st.reduce((a, b) => a + b, 0);
    const res = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      const prob = st[i] / total;
      res[i] += pr[0] * prob;
      if (pr.length > 1) {
        const remaining = st.filter((_, idx) => idx !== i);
        const sub = icmRecursive(remaining, pr.slice(1));
        for (let j = 0; j < sub.length; j++) {
          const idx = j >= i ? j + 1 : j;
          res[idx] += sub[j] * prob;
        }
      }
    }
    return res;
  }

  const raw = icmRecursive(stacks, prizes);
  const floored = raw.map(Math.floor);
  const remainder =
    prizes.reduce((a, b) => a + b, 0) -
    floored.reduce((a, b) => a + b, 0);
  const fractions = raw.map((v, i) => ({ i, frac: v - floored[i] }));
  fractions.sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < remainder; i++) {
    floored[fractions[i].i] += 1;
  }
  return floored;
}

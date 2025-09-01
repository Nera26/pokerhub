export interface Match {
  rating: number;
  rd: number;
  score: number; // 1 win, 0 loss, 0.5 draw
}

export interface RatingState {
  rating: number;
  rd: number;
  volatility: number;
}

const SCALE = 173.7178;
const TAU = 0.5;
const q = Math.log(10) / 400;

/**
 * Update a Glicko-2 rating state given a list of opponent results.
 * @param state Current rating state
 * @param matches Array of opponent ratings, deviations and outcomes
 * @param ageDays Days since the last result to increase deviation
 */
export function updateRating(
  state: RatingState,
  matches: Match[],
  ageDays: number,
): RatingState {
  // Step 1: increase RD for inactivity
  let phi = state.rd / SCALE;
  const sigma = state.volatility;
  phi = Math.sqrt(phi * phi + sigma * sigma * ageDays);
  let mu = state.rating / SCALE;

  if (matches.length === 0) {
    return { rating: mu * SCALE, rd: phi * SCALE, volatility: sigma };
  }

  const g = (phi_j: number) => 1 / Math.sqrt(1 + (3 * q * q * phi_j * phi_j) / Math.PI ** 2);
  const E = (mu_i: number, mu_j: number, phi_j: number) =>
    1 / (1 + Math.exp(-g(phi_j) * (mu_i - mu_j)));

  let vDen = 0;
  let deltaSum = 0;
  for (const m of matches) {
    const mu_j = m.rating / SCALE;
    const phi_j = m.rd / SCALE;
    const E_ij = E(mu, mu_j, phi_j);
    const gPhi = g(phi_j);
    vDen += gPhi * gPhi * E_ij * (1 - E_ij);
    deltaSum += gPhi * (m.score - E_ij);
  }
  const v = 1 / vDen;
  const delta = v * deltaSum;

  const a = Math.log(sigma * sigma);
  const f = (x: number): number => {
    const ex = Math.exp(x);
    return (
      (ex * (delta * delta - phi * phi - v - ex)) /
        (2 * (phi * phi + v + ex) * (phi * phi + v + ex)) -
      (x - a) / (TAU * TAU)
    );
  };
  let A = a;
  let B = delta * delta > phi * phi + v ? Math.log(delta * delta - phi * phi - v) : a - 1;
  let fA = f(A);
  let fB = f(B);
  while (Math.abs(B - A) > 1e-6) {
    const C = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C);
    if (fC * fB < 0) {
      A = B;
      fA = fB;
    }
    B = C;
    fB = fC;
  }
  const sigmaPrime = Math.exp(A / 2);

  const phiStar = Math.sqrt(phi * phi + sigmaPrime * sigmaPrime);
  const phiPrime = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  const muPrime = mu + phiPrime * phiPrime * deltaSum;

  return {
    rating: muPrime * SCALE,
    rd: phiPrime * SCALE,
    volatility: sigmaPrime,
  };
}

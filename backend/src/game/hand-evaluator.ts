enum HandRank {
  HIGH_CARD = 0,
  PAIR = 1,
  TWO_PAIR = 2,
  THREE_OF_A_KIND = 3,
  STRAIGHT = 4,
  FLUSH = 5,
  FULL_HOUSE = 6,
  FOUR_OF_A_KIND = 7,
  STRAIGHT_FLUSH = 8,
}

interface HandValue {
  rank: HandRank;
  kickers: number[]; // ranks high to low
}

const BASE = 15; // larger than highest rank (14)

function score(value: HandValue): number {
  let s = value.rank;
  for (const k of value.kickers) {
    s = s * BASE + k;
  }
  return s;
}

function evaluate5(cards: number[]): HandValue {
  const ranks = cards.map((c) => Math.floor(c / 4)).sort((a, b) => b - a);
  const suits = cards.map((c) => c % 4);
  const isFlush = suits.every((s) => s === suits[0]);

  const unique = Array.from(new Set(ranks)).sort((a, b) => a - b);
  let straightHigh = -1;
  for (let i = 0; i <= unique.length - 5; i++) {
    const seq = unique.slice(i, i + 5);
    if (seq[4] - seq[0] === 4) {
      straightHigh = seq[4];
    }
  }
  // Wheel straight A2345
  if (
    straightHigh === -1 &&
    unique.includes(12) &&
    unique.includes(0) &&
    unique.includes(1) &&
    unique.includes(2) &&
    unique.includes(3)
  ) {
    straightHigh = 3;
  }
  const isStraight = straightHigh !== -1;

  const countMap = new Map<number, number>();
  for (const r of ranks) {
    countMap.set(r, (countMap.get(r) ?? 0) + 1);
  }
  const counts = Array.from(countMap.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });

  if (isStraight && isFlush) {
    return { rank: HandRank.STRAIGHT_FLUSH, kickers: [straightHigh] };
  }
  if (counts[0][1] === 4) {
    const quad = counts[0][0];
    const kicker = ranks.find((r) => r !== quad) ?? 0;
    return { rank: HandRank.FOUR_OF_A_KIND, kickers: [quad, kicker] };
  }
  if (counts[0][1] === 3 && counts[1]?.[1] === 2) {
    return {
      rank: HandRank.FULL_HOUSE,
      kickers: [counts[0][0], counts[1][0]],
    };
  }
  if (isFlush) {
    return { rank: HandRank.FLUSH, kickers: ranks };
  }
  if (isStraight) {
    return { rank: HandRank.STRAIGHT, kickers: [straightHigh] };
  }
  if (counts[0][1] === 3) {
    const trip = counts[0][0];
    const kickers = ranks.filter((r) => r !== trip).slice(0, 2);
    return { rank: HandRank.THREE_OF_A_KIND, kickers: [trip, ...kickers] };
  }
  if (counts[0][1] === 2 && counts[1]?.[1] === 2) {
    const [highPair, lowPair] = [counts[0][0], counts[1][0]].sort((a, b) => b - a);
    const kicker = ranks.find((r) => r !== highPair && r !== lowPair) ?? 0;
    return { rank: HandRank.TWO_PAIR, kickers: [highPair, lowPair, kicker] };
  }
  if (counts[0][1] === 2) {
    const pair = counts[0][0];
    const kickers = ranks.filter((r) => r !== pair).slice(0, 3);
    return { rank: HandRank.PAIR, kickers: [pair, ...kickers] };
  }
  return { rank: HandRank.HIGH_CARD, kickers: ranks.slice(0, 5) };
}

export function evaluateHand(cards: number[]): number {
  if (cards.length < 5) throw new Error('Need at least 5 cards');
  let best = 0;
  for (let i = 0; i < cards.length - 4; i++) {
    for (let j = i + 1; j < cards.length - 3; j++) {
      for (let k = j + 1; k < cards.length - 2; k++) {
        for (let l = k + 1; l < cards.length - 1; l++) {
          for (let m = l + 1; m < cards.length; m++) {
            const five = [cards[i], cards[j], cards[k], cards[l], cards[m]];
            const val = score(evaluate5(five));
            if (val > best) best = val;
          }
        }
      }
    }
  }
  return best;
}

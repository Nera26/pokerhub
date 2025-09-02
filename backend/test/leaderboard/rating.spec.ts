import { updateRating, type RatingState } from '../../src/leaderboard/rating';
import { Glicko2 } from 'glicko2';

describe('updateRating', () => {
  it('matches glicko2 reference implementation', () => {
    const state: RatingState = { rating: 1500, rd: 200, volatility: 0.06 };
    const matches = [
      { rating: 1400, rd: 30, score: 1 },
      { rating: 1550, rd: 100, score: 0 },
      { rating: 1700, rd: 300, score: 0 },
    ];
    const ours = updateRating(state, matches, 0);

    const glicko = new Glicko2({ tau: 0.5, rating: 1500, rd: 200, vol: 0.06 });
    const player = glicko.makePlayer(1500, 200, 0.06);
    const opp1 = glicko.makePlayer(1400, 30, 0.06);
    const opp2 = glicko.makePlayer(1550, 100, 0.06);
    const opp3 = glicko.makePlayer(1700, 300, 0.06);
    glicko.updateRatings([
      [player, opp1, 1],
      [player, opp2, 0],
      [player, opp3, 0],
    ]);
    expect(ours.rating).toBeCloseTo(player.getRating(), 5);
    expect(ours.rd).toBeCloseTo(player.getRd(), 5);
    expect(ours.volatility).toBeCloseTo(player.getVol(), 5);
  });
});

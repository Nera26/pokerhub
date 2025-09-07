import {
  calculateTimingSimilarity,
  calculateSeatProximity,
} from '@shared/analytics/collusion';

describe('average diff similarity wrappers', () => {
  it('calculateTimingSimilarity matches previous calculation', () => {
    const timesA = [100, 200, 300];
    const timesB = [110, 210, 320];
    const expected = 1 / (
      1 +
      (timesA.reduce((acc, v, i) => acc + Math.abs(v - timesB[i]), 0) /
        timesA.length)
    );
    expect(calculateTimingSimilarity(timesA, timesB)).toBeCloseTo(expected);
  });

  it('calculateSeatProximity matches previous calculation', () => {
    const seatsA = [1, 3, 5];
    const seatsB = [2, 4, 7];
    const expected = 1 / (
      1 +
      (seatsA.reduce((acc, v, i) => acc + Math.abs(v - seatsB[i]), 0) /
        seatsA.length)
    );
    expect(calculateSeatProximity(seatsA, seatsB)).toBeCloseTo(expected);
  });
});

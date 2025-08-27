import { Test, TestingModule } from '@nestjs/testing';
import { TournamentsProducer } from '../../src/messaging/tournaments/tournaments.producer';
import { TournamentsConsumer } from '../../src/messaging/tournaments/tournaments.consumer';

describe('Tournaments messaging', () => {
  it('producer should emit scheduling event', async () => {
    const emit = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TournamentsProducer,
        { provide: 'TOURNAMENTS_SERVICE', useValue: { emit } },
      ],
    }).compile();

    const producer = module.get<TournamentsProducer>(TournamentsProducer);
    const date = new Date('2025-01-01T00:00:00Z');
    producer.scheduleTournament('t1', date);
    expect(emit).toHaveBeenCalledWith('tournaments.schedule', {
      tournamentId: 't1',
      startDate: date.toISOString(),
    });
  });

  it('consumer should handle scheduling event', () => {
    const consumer = new TournamentsConsumer();
    expect(() =>
      consumer.handleSchedule({
        tournamentId: 't1',
        startDate: '2025-01-01T00:00:00Z',
      }),
    ).not.toThrow();
  });
});

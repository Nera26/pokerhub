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

  it('consumer schedules tournament start', async () => {
    const scheduler = { scheduleStart: jest.fn().mockResolvedValue(undefined) };
    const analytics = { recordTournamentEvent: jest.fn() };
    const consumer = new TournamentsConsumer(
      scheduler as any,
      analytics as any,
    );
    await consumer.handleSchedule({
      tournamentId: 't1',
      startDate: '2025-01-01T00:00:00Z',
    });
    expect(scheduler.scheduleStart).toHaveBeenCalledWith(
      't1',
      new Date('2025-01-01T00:00:00Z'),
    );
    expect(analytics.recordTournamentEvent).toHaveBeenCalledWith({
      type: 'schedule',
      tournamentId: 't1',
      startDate: '2025-01-01T00:00:00Z',
    });
  });

  it('consumer logs error for invalid payload', async () => {
    const scheduler = { scheduleStart: jest.fn() };
    const consumer = new TournamentsConsumer(scheduler as any);
    const errSpy = jest
      .spyOn((consumer as any).logger, 'error')
      .mockImplementation(() => undefined);
    await consumer.handleSchedule({
      tournamentId: 't1',
      startDate: 'not-a-date',
    });
    expect(scheduler.scheduleStart).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalled();
  });
});

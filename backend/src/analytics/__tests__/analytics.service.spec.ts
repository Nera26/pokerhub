import { AnalyticsService } from '../analytics.service';

describe('AnalyticsService buildAggregation', () => {
  let service: any;

  beforeEach(() => {
    service = {
      redis: { xadd: jest.fn().mockResolvedValue(undefined) },
      producer: { send: jest.fn().mockResolvedValue(undefined) },
      ingest: jest.fn().mockResolvedValue(undefined),
      archive: jest.fn().mockResolvedValue(undefined),
      topicMap: { game: 'hand-topic', tournament: 'tournament-topic' },
      collusionEvents: [],
      runCollusionHeuristics: jest.fn(),
      buildAggregation: (AnalyticsService.prototype as any).buildAggregation,
      recordStream: (AnalyticsService.prototype as any).recordStream,
      validators: {},
      ajv: { errorsText: jest.fn() },
      logger: { warn: jest.fn() },
    };
  });

  it('aggregates game events', async () => {
    const event = { foo: 'bar' };
    await (AnalyticsService.prototype as any).recordGameEvent.call(service, event);
    expect(service.redis.xadd).toHaveBeenCalledWith(
      'analytics:game',
      '*',
      'event',
      JSON.stringify(event),
    );
    expect(service.producer.send).toHaveBeenCalledWith({
      topic: 'hand-topic',
      messages: [{ value: JSON.stringify({ event: 'game.event', data: event }) }],
    });
    expect(service.ingest).toHaveBeenCalledWith('game_event', event);
    expect(service.archive).toHaveBeenCalledWith('game.event', event);
  });

  it('aggregates tournament events', async () => {
    const event = { foo: 'baz' };
    await (AnalyticsService.prototype as any).recordTournamentEvent.call(
      service,
      event,
    );
    expect(service.redis.xadd).toHaveBeenCalledWith(
      'analytics:tournament',
      '*',
      'event',
      JSON.stringify(event),
    );
    expect(service.producer.send).toHaveBeenCalledWith({
      topic: 'tournament-topic',
      messages: [
        { value: JSON.stringify({ event: 'tournament.event', data: event }) },
      ],
    });
    expect(service.ingest).toHaveBeenCalledWith('tournament_event', event);
    expect(service.archive).toHaveBeenCalledWith('tournament.event', event);
  });
});

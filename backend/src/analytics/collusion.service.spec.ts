import { CollusionDetectionService } from './collusion.service';

describe('CollusionDetectionService', () => {
  let service: CollusionDetectionService;

  beforeEach(() => {
    service = new CollusionDetectionService();
  });

  it('clusters users by device and ip', () => {
    const clusters = service.clusterByDeviceAndIp([
      { userId: 'u1', deviceId: 'd1', ip: '1.1.1.1', timestamp: 0 },
      { userId: 'u2', deviceId: 'd1', ip: '2.2.2.2', timestamp: 0 },
      { userId: 'u3', deviceId: 'd3', ip: '1.1.1.1', timestamp: 0 },
    ]);
    expect(clusters.get('d1')).toEqual(new Set(['u1', 'u2']));
    expect(clusters.get('1.1.1.1')).toEqual(new Set(['u1', 'u3']));
  });

  it('detects timing collusion', () => {
    const suspicious = service.detectTimingCollusion([
      { userId: 'u1', timestamp: 1000 },
      { userId: 'u2', timestamp: 2500 },
      { userId: 'u3', timestamp: 2600 },
    ], 500);
    expect(suspicious).toEqual([['u2', 'u3']]);
  });
});


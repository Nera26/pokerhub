import { KycService } from './kyc.service';

describe('KycService', () => {
  let service: KycService;

  beforeEach(() => {
    service = new KycService();
  });

  it('blocks users from restricted countries', async () => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValue({ text: async () => 'IR' });
    await expect(service.verify('good', '1.1.1.1')).rejects.toThrow(
      'Blocked jurisdiction',
    );
  });

  it('blocks sanctioned names', async () => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValue({ text: async () => 'GB' });
    await expect(service.verify('Bad Actor', '1.1.1.1')).rejects.toThrow(
      'Sanctioned individual',
    );
  });
});

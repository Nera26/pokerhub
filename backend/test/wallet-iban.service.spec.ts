import { WalletService } from '../src/wallet/wallet.service';
import { DepositIban } from '../src/wallet/deposit-iban.entity';
import { DepositIbanHistory } from '../src/wallet/deposit-iban-history.entity';

describe('WalletService IBAN methods', () => {
  let service: WalletService;
  const ibans: any[] = [];
  const history: any[] = [];
  beforeEach(() => {
    const ibanRepo = {
      findOne: jest.fn().mockImplementation(() => Promise.resolve(ibans[0] ?? null)),
      save: jest.fn().mockImplementation(async (e) => {
        ibans[0] = { ...(ibans[0] || {}), ...e };
        return ibans[0];
      }),
      create: jest.fn().mockImplementation((e) => e),
    };
    const historyRepo = {
      find: jest.fn().mockResolvedValue(history),
      save: jest.fn().mockImplementation(async (e) => {
        history.push(e);
        return e;
      }),
    };
    const manager = {
      getRepository: (entity: any) =>
        entity === DepositIban ? ibanRepo : historyRepo,
    };
    const accounts = { manager } as any;
    service = new WalletService(
      accounts,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  it('updates and retrieves IBAN', async () => {
    await service.updateDepositIban(
      { iban: 'DE1111222233334444', holder: 'h', instructions: 'i' },
      'admin',
    );
    const current = await service.getDepositIban();
    expect(current.iban).toBe('DE1111222233334444');
    const hist = await service.getIbanHistory();
    expect(hist.history.length).toBe(1);
  });
});

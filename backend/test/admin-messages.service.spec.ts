import { AdminMessagesService } from '../src/notifications/admin-messages.service';
import { AdminMessageEntity } from '../src/notifications/admin-message.entity';
import type { Repository } from 'typeorm';

describe('AdminMessagesService', () => {
  const repo = {
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  } as unknown as Repository<AdminMessageEntity>;
  const service = new AdminMessagesService(repo as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists messages', async () => {
    repo.find = jest.fn().mockResolvedValue([
      {
        id: 1,
        sender: 'Alice',
        userId: 'u1',
        avatar: '/a.png',
        subject: 'Hi',
        preview: 'Hi',
        content: 'Hello',
        time: new Date('2024-01-01T00:00:00Z'),
        read: false,
      },
    ]);
    const res = await service.list();
    expect(res[0].id).toBe(1);
    expect(repo.find).toHaveBeenCalled();
  });

  it('finds message', async () => {
    repo.findOne = jest.fn().mockResolvedValue({
      id: 2,
      sender: 'Bob',
      userId: 'u2',
      avatar: '/b.png',
      subject: 'Yo',
      preview: 'Yo',
      content: 'Hey',
      time: new Date('2024-01-01T00:00:00Z'),
      read: true,
    });
    const res = await service.find(2);
    expect(res?.id).toBe(2);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 2 } });
  });

  it('returns null when not found', async () => {
    repo.findOne = jest.fn().mockResolvedValue(null);
    const res = await service.find(3);
    expect(res).toBeNull();
  });

  it('marks message as read', async () => {
    repo.update = jest.fn().mockResolvedValue({});
    await service.markRead(4);
    expect(repo.update).toHaveBeenCalledWith(4, { read: true });
  });
});

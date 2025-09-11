import { Repository } from 'typeorm';
import { Tournament } from '../../src/database/entities/tournament.entity';
import { Table } from '../../src/database/entities/table.entity';
import { Seat } from '../../src/database/entities/seat.entity';

export function createTournamentRepo(initial: Tournament[]): Repository<Tournament> {
  const items = new Map(initial.map((t) => [t.id, t]));
  return {
    find: jest.fn(async () => Array.from(items.values())),
    findOne: jest.fn(async ({ where: { id } }) => items.get(id)),
    save: jest.fn(async (obj: Tournament) => {
      items.set(obj.id, obj);
      return obj;
    }),
  } as unknown as Repository<Tournament>;
}

export function createSeatRepo(tables: Table[]): Repository<Seat> {
  const seats = tables.flatMap((t) => t.seats);
  const items = new Map(seats.map((s) => [s.id, s]));
  return {
    find: jest.fn(async () => Array.from(items.values())),
    save: jest.fn(async (seat: Seat | Seat[]) => {
      const arr = Array.isArray(seat) ? seat : [seat];
      for (const s of arr) {
        tables.forEach((tbl) => {
          tbl.seats = tbl.seats.filter((seat) => seat.id !== s.id);
        });
        s.table.seats.push(s);
        items.set(s.id, s);
      }
      return Array.isArray(seat) ? arr : arr[0];
    }),
  } as unknown as Repository<Seat>;
}


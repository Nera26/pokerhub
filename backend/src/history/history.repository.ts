import { DataSource, EntityTarget, Repository } from 'typeorm';

/**
 * Generic repository for history entities.
 *
 * Each history entity (game, tournament, wallet) can reuse this class
 * instead of having its own repository implementation.
 */
export class HistoryRepository<T> extends Repository<T> {
  constructor(entity: EntityTarget<T>, dataSource: DataSource) {
    super(entity, dataSource.createEntityManager());
  }
}

export const GAME_HISTORY_REPOSITORY = 'GAME_HISTORY_REPOSITORY';
export const TOURNAMENT_HISTORY_REPOSITORY = 'TOURNAMENT_HISTORY_REPOSITORY';
export const WALLET_HISTORY_REPOSITORY = 'WALLET_HISTORY_REPOSITORY';
export const TOURNAMENT_BRACKET_REPOSITORY = 'TOURNAMENT_BRACKET_REPOSITORY';


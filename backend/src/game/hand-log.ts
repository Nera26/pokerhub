import { GameAction } from './state-machine';

export class HandLog {
  private readonly actions: GameAction[] = [];

  record(action: GameAction) {
    this.actions.push(action);
  }

  getAll(): GameAction[] {
    return [...this.actions];
  }
}

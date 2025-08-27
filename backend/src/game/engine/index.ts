export interface GameState {
  tick: number;
}

export interface GameAction {
  type: string;
  payload?: unknown;
}

/**
 * Simple tick-based game engine.
 * Maintains minimal mutable state and derives the next state
 * from the previous tick's state and incoming actions.
 *
 * NOTE: For sub-5ms latency requirements, consider extracting this
 * engine into a dedicated microservice written in Go or Rust.
 */
export class GameEngine {
  private state: GameState = { tick: 0 };

  tick(): GameState {
    // Future action processing would occur here
    this.state = { tick: this.state.tick + 1 };
    return this.state;
  }

  applyAction(action: GameAction): GameState {
    // Placeholder to eventually handle action
    void action;
    return this.tick();
  }
}

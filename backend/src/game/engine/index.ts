export interface EngineState {
  /**
   * Represents minimal game state required for a single tick.
   * Add only essential data to keep the engine mostly stateless.
   */
  players: string[];
}

/**
 * Core game engine. Designed to operate with minimal internal state;
 * all state needed for the next tick is provided as input.
 */
export class GameEngine {
  tick(state: EngineState, _events: unknown[]): EngineState {
    void _events;
    // TODO: Implement game logic. For now just return the state.
    return { ...state };
  }
}

import { mockHomeDependencies } from './homePageMocks';

jest.mock('@/hooks/useLobbyData');

export function setupHomeTests(): void {
  mockHomeDependencies();
}

import { renderHook, waitFor, act } from '@testing-library/react';
import { setupLobbyCache } from './lobbyCache';

export async function runLobbyCacheTest(
  hook: () => { data: unknown },
): Promise<void> {
  const { fetchMock, wrapper, cleanup } = setupLobbyCache();

  try {
    const { result: first } = renderHook(hook, { wrapper });
    await waitFor(() => expect(first.current.data).toBeDefined());
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const { result: second } = renderHook(hook, { wrapper });
    await waitFor(() => expect(second.current.data).toBeDefined());
    expect(fetchMock).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    const { result: third } = renderHook(hook, { wrapper });
    await waitFor(() => expect(third.current.data).toBeDefined());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  } finally {
    cleanup();
  }
}

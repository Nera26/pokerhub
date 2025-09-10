import { renderHook, act } from '@testing-library/react';
import useChat from '../useChat';

describe('useChat', () => {
  const addEventListener = jest.fn();
  const removeEventListener = jest.fn();
  const close = jest.fn();
  const send = jest.fn();

  const WebSocketMock = jest.fn(() => ({
    addEventListener,
    removeEventListener,
    close,
    send,
    readyState: 1,
  }));

  beforeEach(() => {
    (global as any).WebSocket = WebSocketMock as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('connects and disconnects', () => {
    const { unmount } = renderHook(() => useChat());
    expect(WebSocketMock).toHaveBeenCalledWith('/ws/chat');
    unmount();
    expect(close).toHaveBeenCalled();
  });

  it('sends messages', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.send('hello');
    });
    expect(send).toHaveBeenCalledWith(JSON.stringify({ text: 'hello' }));
  });
});

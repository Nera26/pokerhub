export function setupCountdownTimers() {
  let intervalCb: (() => void) | undefined;
  jest.spyOn(window, 'setInterval').mockImplementation(((cb: TimerHandler) => {
    intervalCb = cb as () => void;
    return 1;
  }) as unknown as typeof setInterval);
  jest.spyOn(window, 'clearInterval').mockImplementation(() => {});
  return (times: number) => {
    for (let i = 0; i < times; i++) {
      intervalCb && intervalCb();
    }
  };
}

export function setupClipboardMocks() {
  const writeTextMock = jest.fn().mockResolvedValue(undefined);
  Object.assign(navigator, {
    clipboard: { writeText: writeTextMock },
  });
  jest.spyOn(window, 'alert').mockImplementation(() => {});
  return writeTextMock;
}

test('wallet utils defined', () => {
  expect(setupCountdownTimers).toBeDefined();
  expect(setupClipboardMocks).toBeDefined();
});

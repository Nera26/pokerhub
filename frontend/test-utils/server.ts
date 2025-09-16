let server: {
  listen: () => void;
  resetHandlers: () => void;
  close: () => void;
  use: (...handlers: unknown[]) => void;
};

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { setupServer } = require('msw/node');
  server = setupServer();
} catch {
  server = {
    listen: () => undefined,
    resetHandlers: () => undefined,
    close: () => undefined,
    use: () => undefined,
  };
}

export { server };

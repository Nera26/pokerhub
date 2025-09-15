let server: {
  listen: () => void;
  resetHandlers: () => void;
  close: () => void;
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
  };
}

export { server };

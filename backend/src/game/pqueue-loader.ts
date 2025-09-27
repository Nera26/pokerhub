export type PQueueCtor = typeof import('p-queue').default;
export type PQueueInstance = InstanceType<PQueueCtor>;

let cachedCtor: PQueueCtor | undefined;
let cachedPromise: Promise<PQueueCtor> | undefined;
let cachedEvalRequire: NodeJS.Require | null | undefined;

const dynamicImport = Function(
  'specifier',
  'return import(specifier);',
) as (specifier: string) => Promise<unknown>;

function getEvalRequire(): NodeJS.Require | null {
  if (cachedEvalRequire !== undefined) {
    return cachedEvalRequire;
  }

  try {
    cachedEvalRequire = eval('require') as NodeJS.Require;
  } catch {
    cachedEvalRequire = null;
  }

  return cachedEvalRequire;
}

function resolveCtor(module: unknown): PQueueCtor {
  const mod = module as { default?: PQueueCtor };
  return mod.default ?? (module as PQueueCtor);
}

function tryRequirePQueue(): PQueueCtor | null {
  const evalRequire = getEvalRequire();

  if (evalRequire) {
    try {
      const required = evalRequire('p-queue');
      return resolveCtor(required);
    } catch (error) {
      if (!shouldFallback(error)) {
        throw error;
      }

      if (isEsmSyntaxError(error)) {
        return createFallbackPQueue();
      }
    }
  }

  return null;
}

function shouldFallback(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  if (error instanceof SyntaxError) {
    return true;
  }

  const { code, name, message } = error as {
    code?: unknown;
    name?: unknown;
    message?: unknown;
  };

  if (code === 'ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING_FLAG' || code === 'ERR_REQUIRE_ESM') {
    return true;
  }

  if (
    typeof message === 'string' &&
    (message.includes('ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING_FLAG') ||
      message.includes('dynamic import callback was invoked without --experimental-vm-modules'))
  ) {
    return true;
  }

  return name === 'SyntaxError';
}

function isEsmSyntaxError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const { message } = error as { message?: unknown };

  if (typeof message !== 'string') {
    return false;
  }

  return (
    message.includes('Cannot use import statement outside a module') ||
    (message.includes('Unexpected token') && message.includes('export'))
  );
}

function createFallbackPQueue(): PQueueCtor {
  class InlinePQueue {
    size = 0;
    pending = 0;
    private queue: Array<() => void> = [];

    constructor(_: unknown) {}

    add<T>(fn: () => PromiseLike<T> | T): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        const task = () => {
          this.pending++;

          Promise.resolve()
            .then(fn)
            .then(resolve, reject)
            .finally(() => {
              this.pending--;
              this.processNext();
            });
        };

        this.queue.push(task);
        this.size = this.queue.length;
        this.processNext();
      });
    }

    clear() {
      this.queue = [];
      this.size = 0;
    }

    private processNext() {
      if (this.pending > 0) {
        return;
      }

      const next = this.queue.shift();
      this.size = this.queue.length;

      if (next) {
        next();
      }
    }
  }

  return InlinePQueue as unknown as PQueueCtor;
}

export async function loadPQueue(): Promise<PQueueCtor> {
  if (cachedCtor) {
    return cachedCtor;
  }

  if (!cachedPromise) {
    cachedPromise = (async () => {
      try {
        const module = await dynamicImport('p-queue');
        const ctor = resolveCtor(module);
        cachedCtor = ctor;
        return ctor;
      } catch (error) {
        if (shouldFallback(error)) {
          const ctor = tryRequirePQueue();

          if (ctor) {
            cachedCtor = ctor;
            return ctor;
          }
        }

        throw error;
      } finally {
        if (cachedCtor) {
          cachedPromise = undefined;
        }
      }
    })();
  }

  return cachedPromise;
}

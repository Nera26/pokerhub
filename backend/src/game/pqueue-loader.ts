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

  const { code, name } = error as { code?: unknown; name?: unknown };

  if (code === 'ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING_FLAG' || code === 'ERR_REQUIRE_ESM') {
    return true;
  }

  return name === 'SyntaxError';
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

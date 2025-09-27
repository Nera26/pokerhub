import { createRequire } from 'node:module';
import { join } from 'node:path';

export type PQueueCtor = typeof import('p-queue').default;
export type PQueueInstance = InstanceType<PQueueCtor>;

let cachedCtor: PQueueCtor | undefined;
let cachedRequire: NodeJS.Require | undefined;

function getRequireShim(): NodeJS.Require {
  if (cachedRequire) {
    return cachedRequire;
  }

  try {
    cachedRequire = eval('require') as NodeJS.Require;
  } catch {
    cachedRequire = createRequire(join(process.cwd(), 'noop.js'));
  }

  return cachedRequire;
}

function resolveCtor(module: unknown): PQueueCtor {
  const mod = module as { default?: PQueueCtor };
  return mod.default ?? (module as PQueueCtor);
}

function tryRequirePQueue(): PQueueCtor {
  const required = getRequireShim()('p-queue');
  return resolveCtor(required);
}

export async function loadPQueue(): Promise<PQueueCtor> {
  if (cachedCtor) {
    return cachedCtor;
  }

  try {
    const module = await import('p-queue');
    const ctor = resolveCtor(module);
    cachedCtor = ctor;
    return ctor;
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: unknown }).code === 'ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING_FLAG'
    ) {
      const ctor = tryRequirePQueue();
      cachedCtor = ctor;
      return ctor;
    }

    throw error;
  }
}

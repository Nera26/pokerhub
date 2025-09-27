export type PQueueCtor = typeof import('p-queue').default;
export type PQueueInstance = InstanceType<PQueueCtor>;

let cachedCtor: PQueueCtor | undefined;

export async function loadPQueue(): Promise<PQueueCtor> {
  if (cachedCtor) {
    return cachedCtor;
  }

  const module = await import('p-queue');
  const ctor = (module as { default?: PQueueCtor }).default ??
    ((module as unknown) as PQueueCtor);
  cachedCtor = ctor;
  return ctor;
}

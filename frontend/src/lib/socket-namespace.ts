import { initNamespaceSocket } from './socket-base';

export function createNamespaceSocket(namespace: string) {
  return initNamespaceSocket(namespace);
}

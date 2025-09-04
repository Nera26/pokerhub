export async function queueMutation(url: string, init: RequestInit) {
  if (navigator.onLine) {
    return fetch(url, init);
  }

  const registration = await navigator.serviceWorker.ready;
  registration.active?.postMessage({
    type: 'QUEUE_MUTATION',
    payload: { url, init },
  });

  return undefined;
}

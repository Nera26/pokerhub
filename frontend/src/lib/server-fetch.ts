/* istanbul ignore file */

export async function serverFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(url, init);
}

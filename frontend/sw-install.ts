export async function precacheOnInstall(): Promise<void> {
  let urls: string[] = [];
  try {
    const res = await fetch('/api/precache');
    if (res.ok) {
      urls = await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch precache list', err);
  }
  try {
    const cache = await caches.open('offline-cache');
    await cache.addAll(urls);
  } catch (err) {
    console.error('Failed to pre-cache assets', err);
  }
}

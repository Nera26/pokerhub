let offset = 0;

export function setServerTime(serverTime: number) {
  offset = serverTime - Date.now();
}

export function getServerTime(): number {
  return Date.now() + offset;
}

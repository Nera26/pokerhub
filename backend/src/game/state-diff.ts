type JsonRecord = Record<string, unknown>;

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

function isRecord(value: unknown): value is JsonRecord {
  return isObject(value) && !Array.isArray(value);
}

export function diff<T>(prev: T | undefined, curr: T): Partial<T> {
  if (prev === undefined || prev === null) return curr;

  if (Array.isArray(prev) && Array.isArray(curr)) {
    const delta: JsonRecord = {};
    const len = curr.length;
    for (let i = 0; i < len; i++) {
      const pv = prev[i];
      const cv = curr[i];
      if (
        pv !== undefined &&
        cv !== undefined &&
        isObject(pv) &&
        isObject(cv)
      ) {
        const d = diff(pv, cv);
        if (isObject(d) && Object.keys(d as JsonRecord).length) {
          delta[i] = d;
        }
      } else if (pv !== cv) {
        delta[i] = cv;
      }
    }
    if (prev.length !== curr.length) {
      delta.length = curr.length;
    }
    return delta as Partial<T>;
  }

  if (isRecord(prev) && isRecord(curr)) {
    const delta: JsonRecord = {};
    for (const key of Object.keys(curr)) {
      const pv = prev[key as keyof typeof prev];
      const cv = curr[key as keyof typeof curr];
      if (
        pv !== undefined &&
        cv !== undefined &&
        isObject(pv) &&
        isObject(cv)
      ) {
        const d = diff(pv, cv);
        if (isObject(d) && Object.keys(d as JsonRecord).length) {
          delta[key] = d;
        }
      } else if (pv !== cv) {
        delta[key] = cv;
      }
    }
    return delta as Partial<T>;
  }

  if (prev !== curr) return curr;
  return {} as Partial<T>;
}


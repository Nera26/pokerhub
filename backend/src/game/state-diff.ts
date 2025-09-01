export function diff<T>(prev: T | undefined, curr: T): Partial<T> {
  if (prev === undefined || prev === null) return curr as Partial<T>;

  if (Array.isArray(prev) && Array.isArray(curr)) {
    const delta: Record<string, unknown> = {};
    const len = curr.length;
    for (let i = 0; i < len; i++) {
      const pv = (prev as unknown[])[i];
      const cv = (curr as unknown[])[i];
      if (
        pv !== undefined &&
        cv !== undefined &&
        typeof pv === 'object' &&
        pv !== null &&
        typeof cv === 'object' &&
        cv !== null
      ) {
        const d = diff(pv as any, cv as any);
        if (Object.keys(d as Record<string, unknown>).length) {
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

  if (
    typeof prev === 'object' &&
    prev !== null &&
    typeof curr === 'object' &&
    curr !== null
  ) {
    const delta: Record<string, unknown> = {};
    for (const key of Object.keys(curr as Record<string, unknown>)) {
      const pv = (prev as Record<string, unknown>)[key];
      const cv = (curr as Record<string, unknown>)[key];
      if (
        pv !== undefined &&
        cv !== undefined &&
        typeof pv === 'object' &&
        pv !== null &&
        typeof cv === 'object' &&
        cv !== null
      ) {
        const d = diff(pv as any, cv as any);
        if (Object.keys(d as Record<string, unknown>).length) {
          (delta as any)[key] = d;
        }
      } else if (pv !== cv) {
        (delta as any)[key] = cv;
      }
    }
    return delta as Partial<T>;
  }

  if (prev !== curr) return curr as Partial<T>;
  return {} as Partial<T>;
}

export const stateDiff = diff;

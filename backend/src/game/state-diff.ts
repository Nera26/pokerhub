export function diff(prev: any, curr: any): Record<string, any> {
  if (!prev) return curr as Record<string, any>;
  const delta: Record<string, any> = {};
  for (const key of Object.keys(curr as Record<string, any>)) {
    const pv = (prev as any)[key];
    const cv = (curr as any)[key];
    if (pv && cv && typeof pv === 'object' && typeof cv === 'object') {
      const d = diff(pv, cv);
      if (Object.keys(d).length) delta[key] = d;
    } else if (pv !== cv) {
      delta[key] = cv;
    }
  }
  return delta;
}

export function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/g, '').trim();
}

export function sanitizeObject<T extends Record<string, unknown>>(input: T): T {
  const output = { ...input } as Record<string, unknown>;
  for (const key of Object.keys(output)) {
    const value = output[key];
    if (typeof value === 'string') {
      output[key] = sanitizeString(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      output[key] = sanitizeObject(value as Record<string, unknown>);
    }
  }
  return output as T;
}

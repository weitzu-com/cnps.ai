// Bound independent live lookups. No results survive this invocation.
export async function mapConcurrent(items, fn, concurrency = 4) {
  const result = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      result[index] = await fn(items[index], index);
    }
  }));
  return result;
}

/** Fire-and-forget a promise, swallowing errors silently. */
export function fireAndForget(p: Promise<unknown>): void {
  p.catch(() => {})
}

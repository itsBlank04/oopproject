type CartEvent = { type: 'added' | 'bump' }
const listeners = new Set<(e: CartEvent) => void>()
export const cartEvents = {
  emit(e: CartEvent) { listeners.forEach(fn => fn(e)) },
  subscribe(fn: (e: CartEvent) => void) { listeners.add(fn); return () => { listeners.delete(fn) } },
}

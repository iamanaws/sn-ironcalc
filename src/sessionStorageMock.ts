/**
 * Patch sessionStorage for sandboxed iframes without 'allow-same-origin'.
 *
 * Standard Notes runs editor plugins in sandboxed iframes. When sessionStorage
 * is accessed in this environment, it throws:
 *   DOMException: Forbidden in a sandboxed document without 'allow-same-origin'
 *
 * IronCalc uses sessionStorage for clipboard IDs during copy/cut operations.
 * This patch wraps the getter to return an in-memory fallback only when needed.
 */

let needsMock = false;
try {
  window.sessionStorage.getItem('__test__');
} catch {
  needsMock = true;
}

if (needsMock) {
  const memoryStorage: Record<string, string> = {};

  const mockStorage: Storage = {
    get length() {
      return Object.keys(memoryStorage).length;
    },
    key(index: number): string | null {
      return Object.keys(memoryStorage)[index] ?? null;
    },
    getItem(key: string): string | null {
      return Object.prototype.hasOwnProperty.call(memoryStorage, key) ? memoryStorage[key] : null;
    },
    setItem(key: string, value: string): void {
      memoryStorage[key] = String(value);
    },
    removeItem(key: string): void {
      delete memoryStorage[key];
    },
    clear(): void {
      Object.keys(memoryStorage).forEach(k => delete memoryStorage[k]);
    },
  };

  Object.defineProperty(window, 'sessionStorage', {
    get: () => mockStorage,
    configurable: true,
  });
}

export {};


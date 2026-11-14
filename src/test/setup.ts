/**
 * Setup Vitest — polyfill localStorage si l'environnement jsdom n'en fournit pas
 * (constaté avec jsdom 25 + vitest 2.1.9 : le getter window.localStorage renvoie
 * undefined). Dans le vrai navigateur, le localStorage natif est utilisé.
 */
import { beforeEach } from 'vitest';

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  const polyfill: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k: string) => store.get(k) ?? null,
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    removeItem: (k: string) => void store.delete(k),
    setItem: (k: string, v: string) => void store.set(k, v),
  };
  Object.defineProperty(globalThis, 'localStorage', { value: polyfill, configurable: true });
}

beforeEach(() => {
  globalThis.localStorage?.clear?.();
});

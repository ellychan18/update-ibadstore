import type { ProductItem } from '../types.js';

const DB_NAME = 'IbadStoreDB';
const DB_VERSION = 1;
const STORE_NAME = 'catalog_cache';
const CACHE_KEY = 'products_data';
const VERSION_KEY = 'products_version';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save products and version to fast IndexedDB storage
 */
export async function saveProductsToCache(products: ProductItem[], version: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      store.put(products, CACHE_KEY);
      store.put(version, VERSION_KEY);
      store.put(Date.now(), 'cached_at');

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (e) {
    // Fallback if IndexedDB fails: keep in memory / sessionStorage if small
    try {
      sessionStorage.setItem('ibad_cached_version', version);
    } catch (_) {}
  }
}

/**
 * Retrieve cached products and version from IndexedDB in milliseconds
 */
export async function getCachedProducts(): Promise<{ products: ProductItem[]; version: string; cachedAt?: number } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);

      const productsReq = store.get(CACHE_KEY);
      const versionReq = store.get(VERSION_KEY);
      const cachedAtReq = store.get('cached_at');

      tx.oncomplete = () => {
        const products = productsReq.result as ProductItem[] | undefined;
        const version = versionReq.result as string | undefined;
        const cachedAt = cachedAtReq.result as number | undefined;

        db.close();
        if (products && Array.isArray(products) && products.length > 0 && version) {
          resolve({ products, version, cachedAt });
        } else {
          resolve(null);
        }
      };

      tx.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch (e) {
    return null;
  }
}

/**
 * Clear cached products (e.g. for hard reset)
 */
export async function clearProductCache(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    db.close();
  } catch (_) {}
}

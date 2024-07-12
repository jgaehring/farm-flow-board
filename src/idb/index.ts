import databases from '@/idb/databases';
import runUpgrades from '@/idb/runUpgrades';
import type { Resource } from '@/data/resources';

type StoreLike = IDBObjectStore | IDBIndex;
type IDBQueryFunc<R> = ((resource: R) => boolean);
type IDBQuery<R> = IDBQueryFunc<R>|string[]|string;

function openDatabase(dbName: string): Promise<IDBDatabase> {
  const config = databases[dbName];
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(config.name, config.version);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = runUpgrades(config);
  });
}

function getOneByPrimaryKey<R>(store: StoreLike, key: string): Promise<R> {
  return new Promise<R>((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result as R);
    request.onerror = () => reject(request.error);
  });
}

export function getManyByPrimaryKeys<R>(
  store: StoreLike,
  keys: string[],
  results: R[] = [],
): Promise<R[]> {
  if (keys.length === 0) return Promise.resolve(results);
  const [head, ...tail] = keys;
  const request = getOneByPrimaryKey<R>(store, head);
  if (tail.length <= 0) return request.then((val: R) => [...results, val]);
  return request.then((r: R) => getManyByPrimaryKeys<R>(store, tail, [...results, r]));
}

function getAllRecords<R>(store: StoreLike): Promise<R[]> {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function cursorQuery<R>(store: StoreLike, query: IDBQueryFunc<R>): Promise<R[]> {
  return new Promise((resolve, reject) => {
    const request = store.openCursor();
    const results: R[] = [];
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        if (query(cursor.value)) {
          results.push(cursor.value);
        }
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    request.onerror = event => reject(event);
  });
}

function getter<R>(
  storeOrIndex: StoreLike,
  query?: IDBQueryFunc<R>|string[]|string,
): Promise<R|R[]> {
  if (typeof query === 'string') {
    return getOneByPrimaryKey<R>(storeOrIndex, query);
  }
  if (Array.isArray(query)) {
    return getManyByPrimaryKeys<R>(storeOrIndex, query);
  }
  if (typeof query === 'function') {
    return cursorQuery<R>(storeOrIndex, query);
  }
  return getAllRecords(storeOrIndex);
}

export function getRecords<R>(
  dbName: string,
  storeName: string,
  query?: IDBQueryFunc<R>|string[]|string,
): Promise<R|R[]> {
  return openDatabase(dbName).then((db) => {
    const store = db.transaction(storeName, 'readonly')
      .objectStore(storeName);
    return getter<R>(store, query);
  });
}

export function getRecordsFromIndex<R>(
  dbName: string,
  storeName: string,
  indexName: string,
  query?: IDBQuery<R>,
) {
  return openDatabase(dbName).then((db) => {
    const index = db.transaction(storeName, 'readonly')
      .objectStore(storeName)
      .index(indexName);
    return getter(index, query);
  });
}

export function count(
  dbName: string,
  storeName: string,
  key: IDBValidKey | IDBKeyRange | undefined,
) {
  return openDatabase(dbName).then(db => new Promise((resolve, reject) => {
    const store = db.transaction(storeName, 'readonly').objectStore(storeName);
    const request = store.count(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }));
}

export function saveRecord(
  dbName: string,
  storeName: string,
  record: Resource,
): Promise<string> {
  return openDatabase(dbName).then(db => new Promise((resolve, reject) => {
    const store = db.transaction(storeName, 'readwrite').objectStore(storeName);
    const request = store.put(record);
    request.onsuccess = () => resolve(request.result as string);
    request.onerror = () => reject(request.error);
  }));
}

export function deleteRecord<R>(
  dbName: string,
  storeName: string,
  query: IDBQuery<R>|string,
): Promise<{ deleted: R|R[] }|typeof query> {
  return openDatabase(dbName).then(db => new Promise((resolve, reject) => {
    const store = db.transaction(storeName, 'readwrite').objectStore(storeName);
    if (typeof query === 'function') {
      const request = store.openCursor();
      const results = { deleted: [] as R[] };
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          if (query(cursor.value)) {
            results.deleted.push(cursor.value);
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = event => reject(event);
    } else {
      const request = store.delete(query);
      request.onsuccess = () => resolve(query);
      request.onerror = () => reject(request.error);
    }
  }));
}

export const deleteDatabase = (dbName: string) => new Promise((resolve, reject) => {
  const request = indexedDB.deleteDatabase(dbName);
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

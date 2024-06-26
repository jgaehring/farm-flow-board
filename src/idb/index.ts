import databases from '@/idb/databases';
import runUpgrades from '@/idb/runUpgrades';

type StoreLike = IDBObjectStore | IDBIndex;

function openDatabase(dbName: keyof typeof databases): Promise<IDBDatabase> {
  const config = databases[dbName];
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(config.name, config.version);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = runUpgrades(config);
  });
}

function getOneByPrimaryKey(store: StoreLike, key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const request: IDBRequest<IDBTransaction> = store.get(key);
    request.onsuccess = request.result ? () => resolve([key, request.result]) : reject;
    request.onerror = () => reject(request.error);
  });
}

function getManyByPrimaryKeys(store: StoreLike, keys: string[], results = {}): Promise<any> {
  if (keys.length === 0) return Promise.resolve(results);
  const [head, ...tail] = keys;
  const mergeResults = ([key, val]: [string, any]) => ({ ...results, [key]: val });
  const request = getOneByPrimaryKey(store, head);
  if (tail.length <= 0) return request.then(mergeResults);
  return request.then(r => getManyByPrimaryKeys(store, tail, mergeResults(r)));
}

function getAllRecords(store: StoreLike) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function cursorQuery(store: StoreLike, query: Function) {
  return new Promise((resolve, reject) => {
    const request = store.openCursor();
    const results: any[] = [];
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

function getter(storeOrIndex: IDBObjectStore|IDBIndex, query: Function) {
  if (!query) {
    return getAllRecords(storeOrIndex);
  }
  if (Array.isArray(query)) {
    return getManyByPrimaryKeys(storeOrIndex, query);
  }
  if (typeof query === 'function') {
    return cursorQuery(storeOrIndex, query);
  }
  return getOneByPrimaryKey(storeOrIndex, query).then(([, data]) => data);
}

export function getRecords(
  dbName: keyof typeof databases,
  storeName: keyof typeof dbName,
  query: Function,
) {
  return openDatabase(dbName).then((db) => {
    const store = db.transaction(storeName, 'readonly')
      .objectStore(storeName);
    return getter(store, query);
  });
}

export function getRecordsFromIndex(
  dbName: keyof typeof databases,
  storeName: keyof typeof dbName,
  indexName: string,
  query: Function,
) {
  return openDatabase(dbName).then((db) => {
    const index = db.transaction(storeName, 'readonly')
      .objectStore(storeName)
      .index(indexName);
    return getter(index, query);
  });
}

export function count(
  dbName: keyof typeof databases,
  storeName: keyof typeof dbName,
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
  dbName: keyof typeof databases,
  storeName: keyof typeof dbName,
  record: any,
  key: IDBValidKey | undefined,
) {
  return openDatabase(dbName).then(db => new Promise((resolve, reject) => {
    const store = db.transaction(storeName, 'readwrite').objectStore(storeName);
    const request = store.put(record, key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }));
}

export function deleteRecord(
  dbName: keyof typeof databases,
  storeName: keyof typeof dbName,
  query: Function,
) {
  return openDatabase(dbName).then(db => new Promise((resolve, reject) => {
    const store = db.transaction(storeName, 'readwrite').objectStore(storeName);
    if (typeof query === 'function') {
      const request = store.openCursor();
      const results = { deleted: [] as any[] };
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
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }
  }));
}

export const deleteDatabase = (dbName: string) => new Promise((resolve, reject) => {
  const request = indexedDB.deleteDatabase(dbName);
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

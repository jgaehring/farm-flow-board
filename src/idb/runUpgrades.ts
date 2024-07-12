import type { IDBDatabaseInfo, IDBStoreUpgrade, IDBStoreConfig, IDBDatabaseConfig } from "./databases";


interface Versionable { version: number }
interface IDBStoreUpgradeParameters extends IDBStoreUpgrade {
  db: IDBDatabaseInfo;
  store: IDBStoreConfig;
}

// Recusive function for running async upgrades sequentially.
export function run(event: IDBVersionChangeEvent, upgrades: IDBStoreUpgradeParameters[]): Promise<IDBObjectStore> {
  const head = upgrades[0];
  const tail = upgrades.slice(1);
  // Wrap every onUpgrade call so we can be sure it returns a promise.
  const result = Promise.resolve(head.onUpgrade(event, head.store, head.db));
  if (tail.length === 0) return result;
  return result.then(() => run(event, tail));
}

// Recursive function for sorting and inserting the next upgrade into an array
// of upgrades, sorted in ascending order by version #.
function sortByVersion<T extends Versionable>(arr: T[], next: T): T[] {
  if (!next) { return arr; }
  const last = arr[arr.length - 1];
  const rest = arr.slice(0, arr.length - 1);
  if (arr.length < 1 || next.version > last.version) {
    return arr.concat(next);
  }
  return sortByVersion(rest, next).concat(last);
}

// Function that takes a minimum version # and returns a reducer function for
// filtering by that minimum and sorting in ascending order.
function filterAndSort<T extends Versionable>(ver: number): (acc: T[], cur: T) => T[] {
  const reducer = (acc: T[], cur: T) => {
    const min = typeof ver === 'number' ? ver : 0;
    if (cur.version > min) {
      return sortByVersion<T>(acc, cur);
    }
    return acc;
  }
  return reducer;
}

const runUpgrades = (config: IDBDatabaseConfig) => (event: IDBVersionChangeEvent) => {
  const reducer = filterAndSort<IDBStoreUpgradeParameters>(event.oldVersion);
  const { stores, ...db } = config;
  const storeUpgrades = stores.flatMap(({ upgrades, ...store }) => 
    upgrades.map(({ version, onUpgrade }) => ({ version, db, store, onUpgrade })));
  const sortedUpgrades = storeUpgrades.reduce(reducer, []);
  return run(event, sortedUpgrades);
};

export default runUpgrades;

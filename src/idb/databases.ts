export interface IDBDatabaseInfo {
  name: string;
  version: number;
}

export interface IDBIndexParameters {
  multiEntry?: boolean;
  unique?: boolean;
}

export interface IDBIndexConfig {
  name: string;
  autoIncrement?: boolean;
  keyPath?: string | string[] | null;
  options?: IDBIndexParameters;
}

export interface IDBStoreConfigWithUpgrades {
  name: string,
  autoIncrement?: boolean;
  keyPath?: string | string[] | null;
  indices?: IDBIndexConfig;
  upgrades: IDBStoreUpgrade[];
}

export interface IDBStoreConfig {
  name: string,
  autoIncrement?: boolean;
  keyPath?: string | string[] | null;
  indices?: IDBIndexConfig;
}

export interface IDBStoreUpgrade {
  version: number;
  onUpgrade: (
    event: IDBVersionChangeEvent,
    store: IDBStoreConfig,
    db: IDBDatabaseInfo,
  ) => Promise<IDBObjectStore>;
}

export interface IDBDatabaseConfig extends IDBDatabaseInfo {
  stores: IDBStoreConfigWithUpgrades[];
}

function createIndices(store: IDBObjectStore, indices?: IDBIndexConfig) {
  if (Array.isArray(indices)) {
    indices.forEach(({ name, keyPath, options }) => {
      store.createIndex(name, keyPath, options);
    });
  }
}

const upgrades = [{
  version: 1,
  onUpgrade: function v1Upgrade(event: IDBVersionChangeEvent, store: IDBStoreConfig): Promise<IDBObjectStore> {
    const {
      name, keyPath = 'id', autoIncrement = false, indices,
    } = store;
    return new Promise((resolve, reject) => {
      const db = (event.target as IDBRequest)?.result as IDBDatabase;
      try {
        const store = db.createObjectStore(name!, { keyPath, autoIncrement });
        createIndices(store, indices);
        resolve(store);
      } catch (error) {
        reject(error);
      }
    });
  },
}];

const databases: { [db: string]: IDBDatabaseConfig } = {
  entities: {
    version: 1,
    name: 'entities',
    stores: [
      {
        name: 'asset',
        keyPath: 'id',
        upgrades,
      },
      {
        name: 'log',
        keyPath: 'id',
        upgrades,
      },
      {
        name: 'plan',
        keyPath: 'id',
        upgrades,
      },
      {
        name: 'taxonomy_term',
        keyPath: 'id',
        upgrades,
      },
    ],
  },
}

export default databases;

import { clone, keys, map, mergeRight, omit, pick } from 'ramda';
import { validate } from 'uuid';
import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import { deleteRecord, getRecords, saveRecord } from '@/idb';
import { fmtBeforeSerialize, objectifyBoardInfo, objectifyLogs, stringifyBoardInfo } from '@/data/deserialize';
import type { BoardData, BoardInfoSerialized, LogResourceSerialized } from '@/data/deserialize';
import { Asset, EntityType, Plan } from '@/data/resources';
import type {
  BoardInfo,
  CropTerm,
  LocationResource, 
  LogIdentifier,
  LogResource,
  PlantResource,
  OperationTerm,
  PartialAsset,
  PartialLog,
  PartialPlan,
  PartialTerm,
  PartialResource,
  PlantIdentifier,
  PlanIdentifier,
  PlanResource,
  Resource,
} from '@/data/resources';
import { createDateSequence, defaultSeason, fallbackRange } from '@/utils/date';

export type CreateValue = LogResource | PlantResource | PlanResource;
export type UpdateValue =
  | PartialAsset
  | PartialLog
  | PartialPlan
  | PartialTerm
  | PartialResource<BoardInfo>;
export type DeleteValue = LogIdentifier | PlantIdentifier | PlanIdentifier;

const safeIncludes = <T>(arr: T[], item: T|null|undefined) =>
  (!item ? false : arr.includes(item));

function updater(orig: Resource, changes: Partial<typeof orig>): typeof orig {
  const merged = mergeRight(orig, changes);
  const valid = pick(keys(orig), merged);
  const fields = omit(['id', 'type'], valid);
  const next = mergeRight(orig, fields);
  return next
}

export default function useBoardData(initInfo?: BoardInfo) {

  const info = ref<BoardInfo|null>(null);

  // All of the core data entities for representing the board data.
  const tasks = ref<LogResource[]>([]);
  const locations = ref<LocationResource[]>([]);
  const plants = ref<PlantResource[]>([]);
  const operations = ref<OperationTerm[]>([]);
  const crops = ref<CropTerm[]>([]);

  // Wrap the date range with default values & compute the sequence.
  const date = computed<{ range: [Date, Date], sequence: Date[] }>(() => {
    // Start & end dates used to populate the x-axis & limit selection in date picker.
    const range = info.value?.dateRange || fallbackRange(defaultSeason);
    // Array of Date objects for every date within the specified range.
    const sequence = createDateSequence(range[0], range[1]);
    return { range, sequence };
  });

  if (initInfo) load(initInfo);

  // Mock retrieving the task & plant entities from a database, API, file, etc.
  async function load(boardInfo?: BoardInfo): Promise<void> {
    if (!boardInfo || !validate(boardInfo.id)) {
      return getAllBoardInfo().then(([b]) => b ? load(b) : Promise.resolve());
    }

    const plantIds = boardInfo.crops.map(c => c.id);
    const cachedPlants = await getRecords(
      'entities',
      EntityType.Asset,
      plantIds,
    ) as PlantResource[];
    const [cropIds, locIds] = cachedPlants.reduce((
      ids: [string[], string[]],
      p: PlantResource,
    ): [string[], string[]] => {
      const [cids, lids] = ids;
      const nextCropIds = cids.includes(p.crop.id)
        ? cids
        : [...cids, p.crop.id];
      const nextLocIds = cids.includes(p.location.id)
        ? lids
        : [...lids, p.location.id];
      return [nextCropIds, nextLocIds];
    }, [[], []]);
    const logQuery = (log: LogResourceSerialized) =>
      safeIncludes(locIds, log.location?.id)
      || safeIncludes(cropIds, log.plant?.id);
    const [cachedCrops, cachedLocs, cachedOps, cachedTasks] = await Promise.allSettled([
      getRecords('entities', EntityType.TaxonomyTerm, cropIds),
      getRecords('entities', EntityType.Asset, locIds),
      getRecords('entities', EntityType.TaxonomyTerm),
      getRecords('entities', EntityType.Log, logQuery).then(objectifyLogs),
    ]);
    function onSettled<T>(result: PromiseSettledResult<T>, state: Ref<T>) {
      if (result.status === 'fulfilled') state.value = result.value;
    }
    info.value = boardInfo;
    plants.value = (cachedPlants);
    onSettled(cachedCrops, crops);
    onSettled(cachedLocs, locations);
    onSettled(cachedOps, operations);
    onSettled(cachedTasks, tasks);
  }

  function importBoard(data: BoardData) {
    if (!validate(data.board.id)) {
      throw new Error(`Invalid ID for board "${data.board.name}": ${data.board.id}`);
    }

    info.value = data.board;
    crops.value = data.crops;
    locations.value = data.locations;
    operations.value = data.operations;
    tasks.value = data.tasks;
    plants.value = data.plants;

    const fmtedData = fmtBeforeSerialize(clone(data));
    return Promise.allSettled([
      saveRecord('entities', EntityType.Plan, fmtedData.board),
      Promise.allSettled(fmtedData.crops.map((record) =>
        saveRecord('entities', EntityType.TaxonomyTerm, record))),
      Promise.allSettled(fmtedData.locations.map((record) =>
        saveRecord('entities', EntityType.Asset, record))),
      Promise.allSettled(fmtedData.operations.map((record) =>
        saveRecord('entities', EntityType.TaxonomyTerm, record))),
      Promise.allSettled(fmtedData.tasks.map((record) =>
        saveRecord('entities', EntityType.Log, record))),
      Promise.allSettled(fmtedData.plants.map((record) =>
        saveRecord('entities', EntityType.Asset, record))),
    ]).then((results) => {
        const [
          infoResults, cropResults, locResults, opResults, taskResults, plantResults,
        ] = results;
        return {
          info: infoResults,
          crops: cropResults,
          locations: locResults,
          operations: opResults,
          tasks: taskResults,
          plants: plantResults,
        }
    });
  }

  function getAllBoardInfo(): Promise<BoardInfo[]> {
    const results = (getRecords(
      'entities',
      EntityType.Plan,
      (p: PlanResource) => p.type === Plan.FarmFlow,
    ) as Promise<BoardInfoSerialized[]>);
    return results.then(map(objectifyBoardInfo));
  }

  function findCollection<R>(value: PartialResource<R>): Ref<((LogResource|PlantResource) & R)[]>| false {
    if (value.type.startsWith(EntityType.Log)) return tasks;
    if (value.type === Asset.Plant) return plants;
    return false;
  }

  function update<R>(value: PartialResource<R>|BoardInfo) {
    const collection = findCollection(value);
    const [storeName] = value.type.split('--');

    if (collection && storeName) {
      let i = collection.value.findIndex(item => item.id === value.id);
      if (i < 0) i = (collection as Ref<R[]>).value.push(value as R) - 1;
      else {
        const state = updater(collection.value[i], value) as R;
        (collection as Ref<R[]>).value[i] = state;
      }
      return saveRecord('entities', storeName, collection.value[i]);
    }
    if (value.type === Plan.FarmFlow && info.value !== null && storeName) {
      const state = updater(info.value, value) as BoardInfo;
      info.value = state;
      const nonReactive = clone(state);
      const serialized = stringifyBoardInfo(nonReactive);
      return saveRecord('entities', storeName, serialized);
    }
    const errMsg = `Invalid update value for resource with UUID ${value.id} of type "${value.type}".`;
    return Promise.reject(new Error(errMsg));
  }

  function onDelete<R>(idfier: PartialResource<R>) {
    const collection = findCollection(idfier);

    if (collection) {
      const i = collection.value.findIndex(r =>
        r.id === idfier.id && r.type === idfier.type);
      if (i >= 0) collection.value.splice(i, 1);
    } else if (idfier.type === Plan.FarmFlow && info.value !== null) {
      info.value = null;
      tasks.value = [];
      locations.value = [];
      plants.value = [];
      operations.value = [];
      crops.value = [];
    }
    const [storeName] = idfier.type.split('--');
    if (storeName) return deleteRecord('entities', storeName, idfier.id);
    return Promise.reject(idfier.id);
  }

  return {
    // STATE: Board
    // The main info entity describing the current board and its metadata.
    info,
    date,

    // STATE: Entities
    // Collections of all the core data entities representing the board data.
    crops,
    locations,
    operations,
    plants,
    tasks,

    // ACTIONS
    // For modifying the board state & data collections.
    delete: onDelete,
    getAllBoardInfo,
    import: importBoard,
    load,
    update,
  }
}

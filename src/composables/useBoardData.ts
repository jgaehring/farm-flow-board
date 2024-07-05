import { mergeRight, omit, pick } from 'ramda';
import { validate } from 'uuid';
import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import {
  boardInfo2023, crops2023, deserialize, locations2023, operations2023,
  plants2023, tasks2023,
} from '@/data/deserialize';
import { boardInfoRandom, generateEntities } from '@/data/random';
import { Asset, Log, Plan } from '@/data/resources';
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
  ResourceIdentifier,
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

function updater<T>(orig: T & ResourceIdentifier, changes: PartialResource<T>): T {
  type K = keyof T & keyof Resource;
  const keys = Object.keys(orig) as K[];
  const valid = pick(keys, changes);
  const fields = omit(['id', 'type'] as K[], valid);
  return mergeRight(orig, fields) as T & Resource;
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
  function load(boardInfo: BoardInfo): void {
    if (!validate(boardInfo.id)) return;
    const { id } = boardInfo;
    info.value = boardInfo;
    if (id === boardInfo2023.id) {
      crops.value = crops2023;
      locations.value = locations2023;
      operations.value = operations2023;
      tasks.value = tasks2023;
      plants.value = plants2023;
    }
    else if (id === boardInfoRandom.id) {
      // Generate a random scatter of tasks for the grid.
      const frequency = 6; // coefficient to adjust total tasks below
      const count = frequency * Math.floor(
        // Correlate total # of tasks to the 2 main parameters, fields & dates.
        Math.sqrt(locations.value.length * date.value.sequence.length)
      );
      const random = generateEntities(
        count,
        locations.value,
        operations.value,
        crops.value,
        [boardInfoRandom.dateRange[0], boardInfoRandom.dateRange[1]],
      );
      crops.value = crops2023;
      locations.value = locations2023;
      operations.value = operations2023;
      tasks.value = random[0];
      plants.value = random[1];
    } else if (id in sessionStorage && typeof sessionStorage[id] === 'string') {
      const data = deserialize(sessionStorage[id]);
      crops.value = data.crops;
      locations.value = data.locations;
      operations.value = data.operations;
      tasks.value = data.tasks;
      plants.value = data.plants;
    }
  }

  type CollectionValue = (UpdateValue | DeleteValue) & ResourceIdentifier;
  type Collection = Ref<CollectionValue[]>;
  function idCollection(value: CollectionValue): Collection | false {
    if (value.type in Log) return tasks;
    if (value.type === Asset.Plant) return plants;
    return false;
  }

  function update(value: UpdateValue): void {
    const collection = idCollection(value);
  
    if (collection) {
      const i = collection.value.findIndex(item => item.id === value.id);
      if (i < 0) collection.value.push(value);
      else collection.value[i] = updater(collection.value[i], value);
    } else if (value.type === Plan.FarmFlow && info.value !== null) {
      if (info.value === null) info.value = value as BoardInfo;
      else info.value = updater(info.value, value as BoardInfo);
    }
  }

  function onDelete(idfier: DeleteValue) {
    const collection = idCollection(idfier);

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
    load,
    update,
  }
}

import { pick, reduce } from 'ramda';
import { v4 as uuid } from 'uuid';
import { Asset, Log, Term } from '@/data/resources';
import type {
  CropIdentifier, CropTerm, DatesByLocation,
  LocationIdentifier, LocationResource, LogResource,
  OperationsByDate, OperationTerm, PlantResource, TaskMatrix,
} from '@/data/resources';
import corn2023 from './corn2023';
import soy2023 from './soy2023';
import { sameDate } from '@/utils/date';

export const locations: LocationResource[] = [
  { id: uuid(), type: Asset.Land, name: 'Home' },
  { id: uuid(), type: Asset.Land, name: 'Johnson' },
  { id: uuid(), type: Asset.Land, name: 'Cotter' },
  { id: uuid(), type: Asset.Land, name: 'Lake' },
  { id: uuid(), type: Asset.Land, name: 'Wendorff 220' },
  { id: uuid(), type: Asset.Land, name: 'Wendorff 60' },
  { id: uuid(), type: Asset.Land, name: 'Yak' },
  { id: uuid(), type: Asset.Land, name: 'Boonie' },
  { id: uuid(), type: Asset.Land, name: 'Heatwole' },
  { id: uuid(), type: Asset.Land, name: 'Stockholm Home' },
  { id: uuid(), type: Asset.Land, name: 'Stockholm East' },
  { id: uuid(), type: Asset.Land, name: 'Carlson' },
  { id: uuid(), type: Asset.Land, name: 'Hlwd 1' },
  { id: uuid(), type: Asset.Land, name: 'Hlwd 2' },
  { id: uuid(), type: Asset.Land, name: 'Hlwd 3' },
  { id: uuid(), type: Asset.Land, name: 'Lilly 1' },
  { id: uuid(), type: Asset.Land, name: 'Lilly 2' },
  { id: uuid(), type: Asset.Land, name: 'Lilly 3' },
  { id: uuid(), type: Asset.Land, name: 'Lilly 4' },
];

export const operations: OperationTerm[] = [
  {
    id: uuid(),
    type: Term.StandardOperatingProcedure,
    name: 'Tillage',
    color: 'royalblue',
    log_type: Log.Activity,
  },
  {
    id: uuid(),
    type: Term.StandardOperatingProcedure,
    name: 'Tine Weed',
    color: 'lightgreen',
    log_type: Log.Activity,
  },
  {
    id: uuid(),
    type: Term.StandardOperatingProcedure,
    name: 'Cultivation',
    color: 'teal',
    log_type: Log.Activity,
  },
  {
    id: uuid(),
    type: Term.StandardOperatingProcedure,
    name: 'Flame Weed',
    color: 'crimson',
    log_type: Log.Activity,
  },
  {
    id: uuid(),
    type: Term.StandardOperatingProcedure,
    name: 'Rotary Hoe',
    color: 'orchid',
    log_type: Log.Activity,
  },
  {
    id: uuid(),
    type: Term.StandardOperatingProcedure,
    name: 'Rock Picking',
    color: 'gold',
    log_type: Log.Activity,
  },
  {
    id: uuid(),
    type: Term.StandardOperatingProcedure,
    name: 'Mow',
    color: 'orangered',
    log_type: Log.Activity,
  },
  {
    id: uuid(),
    type: Term.StandardOperatingProcedure,
    name: 'Plant',
    color: 'blueviolet',
    log_type: Log.Seeding,
  },
  {
    id: uuid(),
    type: Term.StandardOperatingProcedure,
    name: 'Zap',
    color: 'rosybrown',
    log_type: Log.Activity,
  },
];

export const cropTerms: CropTerm[] = [
  { id: uuid(), type: Term.Plant, name: 'Corn', color: 'royalblue' },
  { id: uuid(), type: Term.Plant, name: 'Soy', color: 'orangered' },
];

type RawTaskRecord = { date: string, name: string, notes: string };
type RawCropRecord = {
  plant: string,
  location: string,
  tasks: RawTaskRecord[]
}

// Subtypes and alternative names.
const taskMap = new Map([
  ['FC1', operations[0]],
  ['FC2', operations[0]],
  ['Kovar', operations[1]],
  ['Einbock', operations[1]],
  ['Hatzenbichler', operations[1]],
  ['Treffler', operations[1]],
  ['Hoe', operations[4]],
]);

const toIdfier = pick(['id', 'type']);
interface CropReduction { tasks: LogResource[], plants: PlantResource[] }
export const rawCropsToEntities = reduce((prev: CropReduction, raw: RawCropRecord) => {
  const land = locations.find(loc => loc.name === raw.location);
  const term = cropTerms.find(c => c.name === raw.plant);
  if (!land || !term) return prev;
  const location: LocationIdentifier = toIdfier(land);
  const crop: CropIdentifier = toIdfier(term);
  const plantName = `${term.name}, ${land.name}`;
  const plantResource: PlantResource = {
    id: uuid(), type: Asset.Plant, name: plantName, crop, location,
  };
  const plants = prev.plants.concat(plantResource);
  const plant = toIdfier(plantResource);
  const logs: LogResource[] = raw.tasks.map((task) => {
    let op = operations.find(o => o.name.toLowerCase() === task.name.toLowerCase());
    // Default for unknown ops in sample data: 'Cultivation'
    if (!op) op = taskMap.get(task.name) || operations[2];
    const operation = toIdfier(op);
    const date = new Date(task.date);
    const name = `${op.name}: ${land.name} ${term.name}`;
    const id = uuid();
    const type = op.log_type || Log.Activity;
    return {
      id, type, name, date, location, operation, plant, notes: task.notes,
    };
  });
  const tasks = prev.tasks.concat(logs);
  return { tasks, plants };
}, { tasks: [], plants: [] });
const cornEntities2023 = rawCropsToEntities(corn2023);
const soyEntities2023 = rawCropsToEntities(soy2023);
export const tasks = cornEntities2023.tasks.concat(soyEntities2023.tasks);
export const plants = cornEntities2023.plants.concat(soyEntities2023.plants);

export function toTaskMatrix(
  tasks: LogResource[],
  plants: PlantResource[],
  locations: LocationResource[],
  operations: OperationTerm[],
): TaskMatrix {
  return locations.map(({ id, name }) => ({
    id: id,
    name: name,
    dates: tasks.reduce((byDate: OperationsByDate[], task) => {
      if (task.location.id !== id) return byDate;
      const opId = task.operation?.id;
      // Default for unknown ops in sample data: 'Cultivation'
      const op = opId && operations.find(o => o.id === opId) || operations[2];
      const { date } = task;
      const i = byDate.findIndex(byD => sameDate(byD.date, date));
      if (i < 0) return [...byDate, { date, operations: [op] }];
      return [
        ...byDate.slice(0, i),
        { date, operations: byDate[i].operations.concat(op) },
        ...byDate.slice(i + 1),
      ];
    }, []),
  } as DatesByLocation));
}

export const taskMatrix2023 = toTaskMatrix(tasks, plants, locations, operations);

type RandomTask = { color?: string, date: Date, location: number, type: number };
type TaskGenerator = Generator<RandomTask, void, unknown>
export function* randomTasks(dateRange: [Date, Date], locations: string[]): TaskGenerator {
  const [start, end] = dateRange;
  const interval = Math.floor((end.valueOf() - start.valueOf()) / 24 / 60 / 60 / 1000);
  while (true) {
    const day = Math.floor(Math.random() * interval);
    const date = new Date(start.valueOf() + day * 24 * 60 * 60 * 1000);
    const type = Math.floor(Math.random() * operations.length);
    const location = Math.floor(Math.random() * locations.length);
    const color = operations[type]?.color;
    yield { color, date, location, type };
  }
}

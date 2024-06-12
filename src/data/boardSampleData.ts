import { pick, reduce } from 'ramda';
import { v4 as uuid } from 'uuid';
import { Asset, Log, Term } from '@/data/resources';
import type {
  CropIdentifier, CropTerm,
  LocationIdentifier, LocationResource, LogResource,
  OperationTerm, PlantIdentifier, PlantResource,
} from '@/data/resources';
import corn2023 from './corn2023';
import soy2023 from './soy2023';

export const locations2023: LocationResource[] = [
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

export const operations2023: OperationTerm[] = [
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

export const crops2023: CropTerm[] = [
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
  ['FC1', operations2023[0]],
  ['FC2', operations2023[0]],
  ['Kovar', operations2023[1]],
  ['Einbock', operations2023[1]],
  ['Hatzenbichler', operations2023[1]],
  ['Treffler', operations2023[1]],
  ['Hoe', operations2023[4]],
]);

const toIdfier = pick(['id', 'type']);
interface CropReduction { tasks: LogResource[], plants: PlantResource[] }
export const rawCropsToEntities = reduce((prev: CropReduction, raw: RawCropRecord) => {
  const land = locations2023.find(loc => loc.name === raw.location);
  const term = crops2023.find(c => c.name === raw.plant);
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
    let op = operations2023.find(o => o.name.toLowerCase() === task.name.toLowerCase());
    // Default for unknown ops in sample data: 'Cultivation'
    if (!op) op = taskMap.get(task.name) || operations2023[2];
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
export const tasks2023 = cornEntities2023.tasks.concat(soyEntities2023.tasks);
export const plants2023 = cornEntities2023.plants.concat(soyEntities2023.plants);

type TaskGenerator = Generator<LogResource, void, unknown>
export function* randomTasks(
  dateRange: [Date, Date],
  locations: LocationResource[],
  operations: OperationTerm[],
  plants: PlantResource[],
  crops: CropTerm[],
): TaskGenerator {
  const [start, end] = dateRange;
  const interval = Math.floor((end.valueOf() - start.valueOf()) / 24 / 60 / 60 / 1000);
  while (true) {
    const id = uuid();
    const day = Math.floor(Math.random() * interval);
    const date = new Date(start.valueOf() + day * 24 * 60 * 60 * 1000);
    const opIndex = Math.floor(Math.random() * operations.length);
    const op = operations[opIndex];
    const operation = toIdfier(op);
    const type = op.log_type || Log.Activity;
    const locIndex = Math.floor(Math.random() * locations.length);
    const land = locations[locIndex];
    const location = toIdfier(land);
    const plantResource = plants.find(p => p.location.id === location.id);
    const plant: PlantIdentifier = plantResource
      ? toIdfier(plantResource)
      : { id: uuid(), type: Asset.Plant };
    const crop = plantResource && crops.find(c => c.id === plantResource.crop.id);
    const name = `${op.name}: ${land.name}${crop ? ' ' + crop.name : ''}`;
    yield {
      id, type, name, date, location, operation, plant, notes: '',
    };
  }
}

export function generateEntities(
  count: number,
  locations: LocationResource[],
  operations: OperationTerm[],
  crops: CropTerm[],
  range: [Date, Date],
): [LogResource[], PlantResource[]] {
  const plants = locations.map((location: LocationResource, i): PlantResource => {
    const cropIndex = (i + 1) % crops.length; // to ensure the same crop per location
    const crop = toIdfier(crops[cropIndex]);
    const name = `${crops[cropIndex].name}, ${location.name}`;
    return { id: uuid(), type: Asset.Plant, name, crop, location };
  });
  const taskGenerator = randomTasks(range, locations, operations, plants, crops);
  const tasks: LogResource[] = [];
  for (let i  = 0; i < count; i += 1) {
    const task = taskGenerator.next().value;
    if (task) tasks.push(task);
  }
  return [tasks, plants];
}

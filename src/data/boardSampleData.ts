import { reduce } from 'ramda';
import { v4 as uuid } from 'uuid';
import { Asset, Term } from '@/data/resources';
import type {
  CropTerm, DatesByLocation, LocationResource,
  OperationsByDate, OperationTerm, TaskMatrix,
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
  { id: uuid(), type: Term.StandardOperatingProcedure, name: 'Tillage', color: 'royalblue' },
  { id: uuid(), type: Term.StandardOperatingProcedure, name: 'Tine Weed', color: 'lightgreen' },
  { id: uuid(), type: Term.StandardOperatingProcedure, name: 'Cultivation', color: 'teal' },
  { id: uuid(), type: Term.StandardOperatingProcedure, name: 'Flame Weed', color: 'crimson' },
  { id: uuid(), type: Term.StandardOperatingProcedure, name: 'Rotary Hoe', color: 'orchid' },
  { id: uuid(), type: Term.StandardOperatingProcedure, name: 'Rock Picking', color: 'gold' },
  { id: uuid(), type: Term.StandardOperatingProcedure, name: 'Mow', color: 'orangered' },
  { id: uuid(), type: Term.StandardOperatingProcedure, name: 'Plant', color: 'blueviolet' },
  { id: uuid(), type: Term.StandardOperatingProcedure, name: 'Zap', color: 'rosybrown' },
];

export const cropTypes: CropTerm[] = [
  { id: uuid(), type: Term.Plant, name: 'Corn', color: 'royalblue' },
  { id: uuid(), type: Term.Plant, name: 'Soy', color: 'orangered' },
];

type RawTaskRecord = { date: string, name: string, notes: string };
type RawCropRecord = {
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
const cropToTaskMatrix = reduce((matrix: TaskMatrix, crop: RawCropRecord) => {
  const { location: name } = crop;
  const location = locations.find(loc => loc.name === name);
  if (!location) return matrix;
  const { id } = location;
  const dates = crop.tasks.reduce((byDate: OperationsByDate[], raw: RawTaskRecord) => {
    let op = operations.find(a => a.name.toLowerCase() === raw.name.toLowerCase());
    if (!op) op = taskMap.has(raw.name)
      ? taskMap.get(raw.name) as OperationTerm
      : operations[2]; // 'Cultivation': default for unknown ops in sample data
    const date = new Date(raw.date);
    const i = byDate.findIndex(a => sameDate(a.date, date));
    if (i < 0) return [...byDate, { date, operations: [op] }];
    return [
      ...byDate.slice(0, i),
      { date, operations: byDate[i].operations.concat(op) },
      ...byDate.slice(i + 1),
    ];
  }, [] as OperationsByDate[]);
  const byLocation: DatesByLocation = { id, name, dates };
  return [...matrix, byLocation];
}, []);

export const crop2023 = [
  ...cropToTaskMatrix(corn2023),
  ...cropToTaskMatrix(soy2023),
];

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

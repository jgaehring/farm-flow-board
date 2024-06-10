import { reduce } from 'ramda';
import corn2023 from './corn2023';
import soy2023 from './soy2023';
import { sameDate } from '@/utils/date';

export type LocationResource = { id: number, name: string };
export const locations: LocationResource[] = [
  { id: 0, name: 'Home' },
  { id: 1, name: 'Johnson' },
  { id: 2, name: 'Cotter' },
  { id: 3, name: 'Lake' },
  { id: 4, name: 'Wendorff 220' },
  { id: 5, name: 'Wendorff 60' },
  { id: 6, name: 'Yak' },
  { id: 7, name: 'Boonie' },
  { id: 8, name: 'Heatwole' },
  { id: 9, name: 'Stockholm Home' },
  { id: 10, name: 'Stockholm East' },
  { id: 11, name: 'Carlson' },
  { id: 12, name: 'Hlwd 1' },
  { id: 13, name: 'Hlwd 2' },
  { id: 14, name: 'Hlwd 3' },
  { id: 15, name: 'Lilly 1' },
  { id: 16, name: 'Lilly 2' },
  { id: 17, name: 'Lilly 3' },
  { id: 18, name: 'Lilly 4' },
];

export type OperationResource = { id: number, name: string, color: string };
export const operations: OperationResource[] = [
  { id: 0, name: 'Tillage', color: 'royalblue' },
  { id: 1, name: 'Tine Weed', color: 'lightgreen' },
  { id: 2, name: 'Cultivation', color: 'teal' },
  { id: 3, name: 'Flame Weed', color: 'crimson' },
  { id: 4, name: 'Rotary Hoe', color: 'orchid' },
  { id: 5, name: 'Rock Picking', color: 'gold' },
  { id: 6, name: 'Mow', color: 'orangered' },
  { id: 7, name: 'Plant', color: 'blueviolet' },
  { id: 8, name: 'Zap', color: 'rosybrown' },
];

export type CropResource = { id: number, name: string, color: string };
export const cropTypes: CropResource[] = [
  { id: 0, name: 'Corn', color: 'royalblue' },
  { id: 1, name: 'Soy', color: 'orangered' },
];

type OperationsByDate = { date: Date, operations: OperationResource[] };
type DatesByLocation = { id: number, name: string, dates: OperationsByDate[] };
export type TaskMatrix = DatesByLocation[];

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
      ? taskMap.get(raw.name) as OperationResource
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

export type RandomTask = { color?: string, date: Date, location: number, type: number };
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

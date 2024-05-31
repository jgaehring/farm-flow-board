import { reduce } from 'ramda';
import corn2023 from './corn2023';
import soy2023 from './soy2023';
import { sameDate } from '@/utils/date';

export type LocationRecord = { id: number, name: string };
export const locationRecords: LocationRecord[] = [
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

export type ActionType = { id: number, name: string, color: string };
type ActionTypes = ActionType[];
export const actionTypes: ActionTypes = [
  { id: 0, name: 'Tillage', color: 'royalblue' },
  { id: 1, name: 'Tine Weed', color: 'lightgreen' },
  { id: 2, name: 'Cultivation', color: 'teal' },
  { id: 3, name: 'Flame Weed', color: 'crimson' },
  { id: 4, name: 'Rotary Hoe', color: 'orchid' },
  { id: 5, name: 'Rock Picking', color: 'gold' },
  { id: 6, name: 'Mow', color: 'orangered' },
  { id: 7, name: 'Plant', color: 'blueviolet' },
  { id: 8, name: 'ZAP', color: 'rosybrown' },
];

export type CropType = { id: number, name: string, color: string };
export const cropTypes: CropType[] = [
  { id: 0, name: 'Corn', color: 'royalblue' },
  { id: 1, name: 'Soy', color: 'orangered' },
];

type ActionsByDate = { date: Date, actions: ActionType[] };
type ActionsByLocation = { id: number, name: string, dates: ActionsByDate[] };
export type ActionRecords = ActionsByLocation[];

type RawCropAction = { date: string, name: string, notes: string };
type RawCropRecord = {
  location: string,
  actions: RawCropAction[]
}
const cultivType = actionTypes[2]; // default for unknown actions in sample data
const cropToActionRecords = reduce((actions: ActionsByLocation[], crop: RawCropRecord) => {
  const { location: name } = crop;
  const location = locationRecords.find(loc => loc.name === name);
  if (!location) return actions;
  const { id } = location;
  const dates = crop.actions.reduce((byDate: ActionsByDate[], raw: RawCropAction) => {
    const action = actionTypes.find(a => a.name === raw.name) || cultivType;
    const date = new Date(raw.date);
    const i = byDate.findIndex(a => sameDate(a.date, date));
    if (i < 0) return [...byDate, { date, actions: [action] }];
    return [
      ...byDate.slice(0, i),
      { date, actions: byDate[i].actions.concat(action) },
      ...byDate.slice(i + 1),
    ];
  }, [] as ActionsByDate[]);
  const byLocation: ActionsByLocation = { id, name, dates };
  return [...actions, byLocation];
}, []);

export const crop2023 = [
  ...cropToActionRecords(corn2023),
  ...cropToActionRecords(soy2023),
];

export type RandomAction = { color?: string, date: Date, location: number, type: number };
type ActionGenerator = Generator<RandomAction, void, unknown>
export function* randomActions(dateRange: [Date, Date], locations: string[]): ActionGenerator {
  const [start, end] = dateRange;
  const interval = Math.floor((end.valueOf() - start.valueOf()) / 24 / 60 / 60 / 1000);
  while (true) {
    const day = Math.floor(Math.random() * interval);
    const date = new Date(start.valueOf() + day * 24 * 60 * 60 * 1000);
    const type = Math.floor(Math.random() * actionTypes.length);
    const location = Math.floor(Math.random() * locations.length);
    const color = actionTypes[type]?.color;
    yield { color, date, location, type };
  }
}

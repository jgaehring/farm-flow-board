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

type ActionType = { id: number, name: string, color: string };
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

type ActionsByDate = { date: Date, actions: ActionType[] };
type ActionsByLocation = { id: number, name: string, dates: ActionsByDate[] };
export type ActionRecords = ActionsByLocation[]
export const toLocationsMap = (locs: string[]): ActionRecords => 
  locs.map((name: string, id: number) => ({ id, name, dates: [] }));

export const locationsMap: Array<{
  name: string, actions: ActionRecords[],
}> = [
  { name: 'Home', actions: [] },
  { name: 'Johnson', actions: [] },
  { name: 'Cotter', actions: [] },
  { name: 'Lake', actions: [] },
  { name: 'Wendorff 220', actions: [] },
  { name: 'Wendorff 60', actions: [] },
  { name: 'Yak', actions: [] },
  { name: 'Boonie', actions: [] },
  { name: 'Heatwole', actions: [] },
  { name: 'Stockholm Home', actions: [] },
  { name: 'Stockholm East', actions: [] },
  { name: 'Carlson', actions: [] },
  { name: 'Hlwd 1', actions: [] },
  { name: 'Hlwd 2', actions: [] },
  { name: 'Hlwd 3', actions: [] },
  { name: 'Lilly 1', actions: [] },
  { name: 'Lilly 2', actions: [] },
  { name: 'Lilly 3', actions: [] },
  { name: 'Lilly 4', actions: [] },
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

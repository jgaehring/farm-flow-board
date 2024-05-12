export type LocationRecord = { id: number, name: string };
export const locationRecords: Map<number, LocationRecord> = new Map([
  [0, { id: 0, name: 'Home' }],
  [1, { id: 1, name: 'Johnson' }],
  [2, { id: 2, name: 'Cotter' }],
  [3, { id: 3, name: 'Lake' }],
  [4, { id: 4, name: 'Wendorff 220' }],
  [5, { id: 5, name: 'Wendorff 60' }],
  [6, { id: 6, name: 'Yak' }],
  [7, { id: 7, name: 'Boonie' }],
  [8, { id: 8, name: 'Heatwole' }],
  [9, { id: 9, name: 'Stockholm Home' }],
  [10, { id: 10, name: 'Stockholm East' }],
  [11, { id: 11, name: 'Carlson' }],
  [12, { id: 12, name: 'Hlwd 1' }],
  [13, { id: 13, name: 'Hlwd 2' }],
  [14, { id: 14, name: 'Hlwd 3' }],
  [15, { id: 15, name: 'Lilly 1' }],
  [16, { id: 16, name: 'Lilly 2' }],
  [17, { id: 17, name: 'Lilly 3' }],
  [18, { id: 18, name: 'Lilly 4' }],
]);

type ActionType = { id: number, name: string, color: string };
type ActionTypes = Map<number, ActionType>;
export const actionTypes: ActionTypes = new Map([
  [0, { id: 0, name: 'Tillage', color: 'royalblue' }],
  [1, { id: 1, name: 'Tine Weed', color: 'lightgreen' }],
  [2, { id: 2, name: 'Cultivation', color: 'teal' }],
  [3, { id: 3, name: 'Flame Weed', color: 'crimson' }],
  [4, { id: 4, name: 'Rotary Hoe', color: 'orchid' }],
  [5, { id: 5, name: 'Rock Picking', color: 'gold' }],
  [6, { id: 6, name: 'Mow', color: 'orangered' }],
  [7, { id: 7, name: 'Plant', color: 'blueviolet' }],
  [8, { id: 8, name: 'ZAP', color: 'rosybrown' }],
]);

type ActionsByDate = { date: Date, actions: ActionType[] };
type ActionsByLocation = { id: number, name: string, dates: ActionsByDate[] };
export type ActionRecords = Map<number, ActionsByLocation>
export const toLocationsMap = (locs: string[]): ActionRecords => new Map(
  locs.map((name: string, id: number) => [id, { id, name, dates: [] }]),
);

export const locationsMap: Map<number, {
  name: string, actions: ActionRecords[],
}> = new Map([
  [0, { name: 'Home', actions: [] }],
  [1, { name: 'Johnson', actions: [] }],
  [2, { name: 'Cotter', actions: [] }],
  [3, { name: 'Lake', actions: [] }],
  [4, { name: 'Wendorff 220', actions: [] }],
  [5, { name: 'Wendorff 60', actions: [] }],
  [6, { name: 'Yak', actions: [] }],
  [7, { name: 'Boonie', actions: [] }],
  [8, { name: 'Heatwole', actions: [] }],
  [9, { name: 'Stockholm Home', actions: [] }],
  [10, { name: 'Stockholm East', actions: [] }],
  [11, { name: 'Carlson', actions: [] }],
  [12, { name: 'Hlwd 1', actions: [] }],
  [13, { name: 'Hlwd 2', actions: [] }],
  [14, { name: 'Hlwd 3', actions: [] }],
  [15, { name: 'Lilly 1', actions: [] }],
  [16, { name: 'Lilly 2', actions: [] }],
  [17, { name: 'Lilly 3', actions: [] }],
  [18, { name: 'Lilly 4', actions: [] }],
]);

export type RandomAction = { color?: string, date: Date, location: number, type: number };
type ActionGenerator = Generator<RandomAction, void, unknown>
export function* randomActions(dateRange: [Date, Date], locations: string[]): ActionGenerator {
  const [start, end] = dateRange;
  const interval = Math.floor((end.valueOf() - start.valueOf()) / 24 / 60 / 60 / 1000);
  while (true) {
    const day = Math.floor(Math.random() * interval);
    const date = new Date(start.valueOf() + day * 24 * 60 * 60 * 1000);
    const type = Math.floor(Math.random() * actionTypes.size);
    const location = Math.floor(Math.random() * locations.length);
    const color = actionTypes.get(type)?.color;
    yield { color, date, location, type };
  }
}

export const farmFields: string[] = [
  'Home',
  'Johnson',
  'Cotter',
  'Lake',
  'Wendorff 220',
  'Wendorff 60',
  'Yak',
  'Boonie',
  'Heatwole',
  'Stockholm Home',
  'Stockholm East',
  'Carlson',
  'Hlwd 1',
  'Hlwd 2',
  'Hlwd 3',
  'Lilly 1',
  'Lilly 2',
  'Lilly 3',
  'Lilly 4',
];

type ActionMap = Map<number, { name: string, color: string}>;
export const actionTypes: ActionMap = new Map([
  [0, { name: 'Tillage', color: 'royalblue' }],
  [1, { name: 'Tine Weed', color: 'lightgreen' }],
  [2, { name: 'Cultivation', color: 'teal' }],
  [3, { name: 'Flame Weed', color: 'crimson' }],
  [4, { name: 'Rotary Hoe', color: 'orchid' }],
  [5, { name: 'Rock Picking', color: 'gold' }],
  [6, { name: 'Mow', color: 'orangered' }],
  [7, { name: 'Plant', color: 'blueviolet' }],
  [8, { name: 'ZAP', color: 'rosybrown' }],
]);
export type ActionRecord = { color?: string, date: Date, location: number, type: number };

type ActionGenerator = Generator<ActionRecord, void, unknown>
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

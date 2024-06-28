import { evolve, map } from 'ramda';
import type {
  BoardInfo, CropTerm, LocationResource, LogResource, OperationTerm, PlantResource,
} from '@/data/resources';
import entities2023 from './test-data.json';

export interface BoardData {
  board: BoardInfo,
  crops: CropTerm[],
  locations: LocationResource[],
  operations: OperationTerm[],
  plants: PlantResource[],
  tasks: LogResource[],
}

const date = (str: string) => new Date(str);
const withDateObj = evolve({ date });
const dateRange = evolve({ dateRange: map(date)})

const deserialize = evolve({
  tasks: t => t.map(withDateObj),
  board: dateRange,
});

export const {
  crops: crops2023,
  locations: locations2023,
  operations: operations2023,
  plants: plants2023,
  tasks: tasks2023,
  board: boardInfo2023,
} = deserialize(entities2023) as BoardData;

export default deserialize as (json: typeof entities2023) => BoardData;

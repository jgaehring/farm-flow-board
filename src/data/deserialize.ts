import { evolve, map } from 'ramda';
import type {
  BoardInfo, CropTerm, LocationResource, LogResource, OperationTerm, PlantResource,
} from '@/data/resources';
import entities2023 from './test-data.json';

const date = (str: string) => new Date(str);
const withDateObj = evolve({ date });
const dateRange = evolve({ dateRange: map(date)})

export const crops2023 = entities2023.crops as CropTerm[];
export const locations2023 = entities2023.locations as LocationResource[];
export const operations2023 = entities2023.operations as OperationTerm[];
export const plants2023 = entities2023.plants as PlantResource[];
export const tasks2023 = entities2023.tasks.map(withDateObj) as LogResource[];
export const boardInfo2023 = dateRange(entities2023.board) as BoardInfo;

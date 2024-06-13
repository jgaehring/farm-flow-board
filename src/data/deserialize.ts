import { evolve } from 'ramda';
import type {
  CropTerm, LocationResource, LogResource, OperationTerm, PlantResource,
} from '@/data/resources';
import entities2023 from './test-data.json';

const withDateObj = evolve({ date: (str: string) => new Date(str) });

export const crops2023 = entities2023.crops as unknown as CropTerm[];
export const locations2023 = entities2023.locations as unknown as LocationResource[];
export const operations2023 = entities2023.operations as unknown as OperationTerm[];
export const plants2023 = entities2023.plants as unknown as PlantResource[];
export const tasks2023 = entities2023.tasks.map(withDateObj) as unknown as LogResource[];

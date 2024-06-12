import { writeFileSync } from 'fs';
import { describe, expect, it } from 'vitest';
import {
  crops2023, locations2023, operations2023, plants2023,
  rawCropsToEntities, tasks2023,
} from './boardSampleData';
import corn2023 from './corn2023';
import soy2023 from './soy2023';
import type { DatesByLocation, OperationsByDate, TaskMatrix } from '@/canvas/board';
import type {
  CropTerm, LocationResource, LogResource, OperationTerm, PlantResource,
} from '@/data/resources';
import { sameDate } from '@/utils/date';

export function toTaskMatrix(
  tasks: LogResource[],
  plants: PlantResource[],
  locations: LocationResource[],
  crops: CropTerm[],
  operations: OperationTerm[],
): TaskMatrix {
  return locations.map(({ id, name }) => {
    const crop = crops.find(crop => plants.some(plant =>
      crop.id === plant.crop.id && plant.location.id === id));
    const dates = tasks.reduce((byDate: OperationsByDate[], task) => {
      if (task.location.id !== id) return byDate;
      const opId = task.operation?.id;
      // Default for unknown ops in sample data: 'Cultivation'
      const op = opId && operations.find(o => o.id === opId) || operations[2];
      const { date } = task;
      const i = byDate.findIndex(byD => sameDate(byD.date, date));
      if (i < 0) return [...byDate, { date, operations: [op] }];
      return [
        ...byDate.slice(0, i),
        { date, operations: byDate[i].operations.concat(op) },
        ...byDate.slice(i + 1),
      ];
    }, []);
    return { id, name, crop, dates } as DatesByLocation;
  });
}

/**
 * This is intended as a temporary test that can eventually be used to generate
 * the JSON and/or CSV data which will replace it. To run it alone:
 *    npm run test:unit src/data/boardSampleData.test.ts -- --watch=false
 */
describe('toTaskMatrix', () => {
  const resources2023 = {
    tasks: [] as LogResource[],
    plants: [] as PlantResource[],
    locations: locations2023,
    crops: crops2023,
    operations: operations2023,
  };
  it('Converts raw sample data to logs and assets', () => {
    const cornEntities2023 = rawCropsToEntities(corn2023);
    const soyEntities2023 = rawCropsToEntities(soy2023);

    resources2023.tasks = cornEntities2023.tasks.concat(soyEntities2023.tasks);
    resources2023.plants = cornEntities2023.plants.concat(soyEntities2023.plants);

    const json = JSON.stringify(resources2023, null, 2);
    writeFileSync('dist/test-data.json', json);

    expect(resources2023.tasks).toHaveLength(tasks2023.length);
    expect(resources2023.plants).toHaveLength(plants2023.length);
    });
    it('Converts raw logs and assets to a TaskMatrix', () => {
    const matrix = toTaskMatrix(
      resources2023.tasks,
      resources2023.plants,
      resources2023.locations,
      resources2023.crops,
      resources2023.operations,
    );
    const json = JSON.stringify(matrix, null, 2);
    writeFileSync('dist/test-matrix.json', json);
    expect(matrix);
  });
});

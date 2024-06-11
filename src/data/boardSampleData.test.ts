import { writeFileSync } from 'fs';
import { describe, expect, it } from 'vitest';
import {
  tasks, plants, locations, cropTerms, operations,
  rawCropsToEntities, toTaskMatrix,
} from './boardSampleData';
import corn2023 from './corn2023';
import soy2023 from './soy2023';
import type { LogResource, PlantResource } from './resources';

/**
 * This is intended as a temporary test that can eventually be used to generate
 * the JSON and/or CSV data which will replace it. To run it alone:
 *    npm run test:unit src/data/boardSampleData.test.ts -- --watch=false
 */
describe('toTaskMatrix', () => {
  const resources2023 = {
    tasks: [] as LogResource[],
    plants: [] as PlantResource[],
    locations,
    crops: cropTerms,
    operations,
  };
  it('Converts raw sample data to logs and assets', () => {
    const cornEntities2023 = rawCropsToEntities(corn2023);
    const soyEntities2023 = rawCropsToEntities(soy2023);

    resources2023.tasks = cornEntities2023.tasks.concat(soyEntities2023.tasks);
    resources2023.plants = cornEntities2023.plants.concat(soyEntities2023.plants);

    const json = JSON.stringify(resources2023, null, 2);
    writeFileSync('dist/test-data.json', json);

    expect(resources2023.tasks).toHaveLength(tasks.length);
    expect(resources2023.plants).toHaveLength(plants.length);
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

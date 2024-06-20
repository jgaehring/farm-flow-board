import { v4 as uuid } from 'uuid';
import { Asset, Log } from '@/data/resources';
import { Plan } from '@/data/resources';
import type {
  BoardInfo, CropTerm, LocationResource, LogResource,
  OperationTerm, PlantIdentifier, PlantResource,
} from '@/data/resources';
import { toIdfier } from '@/utils/idfier';

export const boardInfoRandom: BoardInfo = {
  id: 'f9dd7461-4eb3-4c3e-b6ee-e3e9b3a3dffd',
  type: Plan.FarmFlow,
  name: 'Random',
  dateRange: [new Date(2024, 2, 28), new Date(2024, 9)],
};

type TaskGenerator = Generator<LogResource, void, unknown>
export function* randomTasks(
  dateRange: [Date, Date],
  locations: LocationResource[],
  operations: OperationTerm[],
  plants: PlantResource[],
  crops: CropTerm[],
): TaskGenerator {
  const [start, end] = dateRange;
  const interval = Math.floor((end.valueOf() - start.valueOf()) / 24 / 60 / 60 / 1000);
  while (true) {
    const id = uuid();
    const day = Math.floor(Math.random() * interval);
    const date = new Date(start.valueOf() + day * 24 * 60 * 60 * 1000);
    const opIndex = Math.floor(Math.random() * operations.length);
    const op = operations[opIndex];
    const operation = toIdfier(op);
    const type = op.log_type || Log.Activity;
    const locIndex = Math.floor(Math.random() * locations.length);
    const land = locations[locIndex];
    const location = toIdfier(land);
    const plantResource = plants.find(p => p.location.id === location.id);
    const plant: PlantIdentifier = plantResource
      ? toIdfier(plantResource)
      : { id: uuid(), type: Asset.Plant };
    const crop = plantResource && crops.find(c => c.id === plantResource.crop.id);
    const name = `${op.name}: ${land.name}${crop ? ' ' + crop.name : ''}`;
    yield {
      id, type, name, date, location, operation, plant, notes: '',
    };
  }
}

export function generateEntities(
  count: number,
  locations: LocationResource[],
  operations: OperationTerm[],
  crops: CropTerm[],
  range: [Date, Date],
): [LogResource[], PlantResource[]] {
  const plants = locations.map((location: LocationResource, i): PlantResource => {
    const cropIndex = (i + 1) % crops.length; // to ensure the same crop per location
    const crop = toIdfier(crops[cropIndex]);
    const name = `${crops[cropIndex].name}, ${location.name}`;
    return { id: uuid(), type: Asset.Plant, name, crop, location };
  });
  const taskGenerator = randomTasks(range, locations, operations, plants, crops);
  const tasks: LogResource[] = [];
  for (let i  = 0; i < count; i += 1) {
    const task = taskGenerator.next().value;
    if (task) tasks.push(task);
  }
  return [tasks, plants];
}

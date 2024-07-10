import { clone, compose, evolve } from 'ramda';
import {
  fromDate, getLocalTimeZone, parseDate, parseZonedDateTime, toCalendarDate,
} from '@internationalized/date';
import type {
  BoardInfo, CropTerm, LocationIdentifier, LocationResource, Log, LogResource,
  OperationIdentifier, OperationTerm, Plan, PlanResource, PlantIdentifier, PlantResource, Resource,
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

export interface LogResourceSerialized extends Resource {
  type: Log,
  date: string,
  location: LocationIdentifier | null,
  operation: OperationIdentifier | null,
  plant: PlantIdentifier | null,
  notes: string,
}

export interface BoardInfoSerialized extends PlanResource {
  type: Plan.FarmFlow,
  dateRange: [string, string],
  crops: PlantIdentifier[],
}
export interface BoardDataSerialized {
  board: BoardInfoSerialized,
  crops: CropTerm[],
  locations: LocationResource[],
  operations: OperationTerm[],
  plants: PlantResource[],
  tasks: LogResourceSerialized[],
}

const stringifyDate = (d: Date) =>
  toCalendarDate(fromDate(d, getLocalTimeZone())).toString();
const stringifyDateTime = (d: Date) =>
  fromDate(d, getLocalTimeZone()).toString();

const stringifyDateRange = ([d1, d2]: [Date, Date]): [string, string] =>
  [stringifyDate(d1), stringifyDate(d2)];
type stringifyBoardInfo = (board: BoardInfo) => BoardInfoSerialized;
// export const stringifyBoardInfo: stringifyBoardInfo = evolve({ dateRange: stringifyDateRange });
// export const serializeBoardInfo = (b: BoardInfo) => stringifyBoardInfo(clone(b));
export const stringifyBoardInfo: stringifyBoardInfo = compose(
  evolve({ dateRange: stringifyDateRange }) as stringifyBoardInfo,
  clone,
);

const stringifyLog = evolve({ date: stringifyDateTime })
const stringifyLogs = (t: LogResource|LogResource[]) =>
  (Array.isArray(t) ? t.map(stringifyLog) : stringifyLog(t));

export const fmtBeforeSerialize = evolve({
  tasks: stringifyLogs,
  board: stringifyBoardInfo,
}) as (data: BoardData) => BoardDataSerialized;

export function serialize(
  data: BoardData,
  replacer?: ((key: string, val: any) => any) | (string | number)[] | null,
  space?: string | number,
): string {
  const board = fmtBeforeSerialize(data);
  if (!replacer) return JSON.stringify(board, null, space);
  if (Array.isArray(replacer)) {
    replacer as (string | number)[];
    return JSON.stringify(board, replacer, space);
  }
  replacer as (key: string, val: any) => any;
  return JSON.stringify(board, replacer, space);
}

const objectifyDate = (str: string): Date =>
  parseDate(str).toDate(getLocalTimeZone());
const objectifyDateTime = (str: string): Date =>
  parseZonedDateTime(str).toDate();

const objectifyDateRange = ([d1, d2]: [string, string]): [Date, Date] =>
  [objectifyDate(d1), objectifyDate(d2)];
export const objectifyBoardInfo = evolve({ dateRange: objectifyDateRange });

const objectifyLog = evolve({ date: objectifyDateTime })
export const objectifyLogs = (t: LogResourceSerialized|LogResourceSerialized[]) =>
  (Array.isArray(t) ? t.map(objectifyLog) : objectifyLog(t));

export const fmtAfterDeserialize = evolve({
  tasks: objectifyLogs,
  board: objectifyBoardInfo,
}) as (json: BoardDataSerialized) => BoardData;

export function deserialize(
  json: string,
  reviver?: ((key: string, val: any) => any) | undefined,
): BoardData {
  const data = JSON.parse(json, reviver);
  return fmtAfterDeserialize(data);
}

export const {
  crops: crops2023,
  locations: locations2023,
  operations: operations2023,
  plants: plants2023,
  tasks: tasks2023,
  board: boardInfo2023,
} = fmtAfterDeserialize(entities2023 as unknown as BoardDataSerialized);

import { clone, compose, evolve, is, when } from 'ramda';
import {
  fromDate, getLocalTimeZone, parseDate, parseZonedDateTime, toCalendarDate,
} from '@internationalized/date';
import type {
  BoardInfo, CropTerm, LocationResource, LogIdentifier, LogResource,
  OperationTerm, PlanIdentifier, PlantResource, Resource,
} from '@/data/resources';

export interface BoardData {
  board: BoardInfo,
  crops: CropTerm[],
  locations: LocationResource[],
  operations: OperationTerm[],
  plants: PlantResource[],
  tasks: LogResource[],
}

export type LogResourceSerialized = LogIdentifier & {
  name: string;
  date: string;
  location: LogResource['location'];
  operation: LogResource['operation'];
  plant: LogResource['plant'];
  notes: LogResource['notes'];
}

export type BoardInfoSerialized = PlanIdentifier<'plan--farm_flow_board'> & {
  name: string;
  dateRange: [string, string];
  crops: BoardInfo['crops'];
}
export interface BoardDataSerialized {
  board: BoardInfoSerialized;
  crops: CropTerm[];
  locations: LocationResource[];
  operations: OperationTerm[];
  plants: PlantResource[];
  tasks: LogResourceSerialized[];
}

const stringifyDate = (d: Date) =>
  toCalendarDate(fromDate(d, getLocalTimeZone())).toString();
const stringifyDateTime = (d: Date) =>
  fromDate(d, getLocalTimeZone()).toString();

const stringifyDateRange = ([d1, d2]: [Date, Date]): [string, string] =>
  [stringifyDate(d1), stringifyDate(d2)];
type stringifyBoardInfo = (board: BoardInfo) => BoardInfoSerialized;
export const stringifyBoardInfo: stringifyBoardInfo = compose(
  evolve({ dateRange: stringifyDateRange }) as stringifyBoardInfo,
  clone,
);

const stringifyDateProp = evolve({ date: when(is(Object), stringifyDateTime) })
export const stringifyDateTimeProps = (t: object|object[]) =>
  (Array.isArray(t) ? t.map(stringifyDateProp) : stringifyDateProp(t)) as Resource|Resource[];

export const fmtBeforeSerialize = evolve({
  tasks: stringifyDateTimeProps,
  board: stringifyBoardInfo,
}) as (data: BoardData) => BoardDataSerialized;

type fnReplacer = (key: string, val: unknown) => typeof val|string;
export function serialize(
  data: BoardData,
  replacer?: (string | number)[] | fnReplacer | null,
  space?: string | number,
): string {
  const board = fmtBeforeSerialize(data);
  if (!replacer) return JSON.stringify(board, null, space);
  if (Array.isArray(replacer)) {
    return JSON.stringify(board, replacer, space);
  }
  return JSON.stringify(board, replacer, space);
}

const objectifyDate = (str: string): Date =>
  parseDate(str).toDate(getLocalTimeZone());
const objectifyDateTime = (str: string): Date =>
  parseZonedDateTime(str).toDate();

const objectifyDateRange = ([d1, d2]: [string, string]): [Date, Date] =>
  [objectifyDate(d1), objectifyDate(d2)];
export const objectifyBoardInfo = evolve({ dateRange: objectifyDateRange });

const objectifyDateProp = evolve({ date: when(is(String), objectifyDateTime) })
export const objectifyDateTimeProps = (t: LogResourceSerialized|LogResourceSerialized[]) =>
  (Array.isArray(t) ? t.map(objectifyDateProp) : objectifyDateProp(t));

export const fmtAfterDeserialize = evolve({
  tasks: objectifyDateTimeProps,
  board: objectifyBoardInfo,
}) as (json: BoardDataSerialized) => BoardData;

export function deserialize(
  json: string,
  reviver?: (fnReplacer) | undefined,
): BoardData {
  const data = JSON.parse(json, reviver);
  return fmtAfterDeserialize(data);
}

import { evolve, map } from 'ramda';
import {
  fromDate, getLocalTimeZone, parseDate, parseZonedDateTime, toCalendarDate,
} from '@internationalized/date';
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

export const deserializeDate = (str: string) =>
  parseDate(str).toDate(getLocalTimeZone());
export const deserializeDateTime = (str: string) =>
  parseZonedDateTime(str).toDate();

export const serializeDate = (d: Date) =>
  toCalendarDate(fromDate(d, getLocalTimeZone())).toString();
export const serializeDateTime = (d: Date) =>
  fromDate(d, getLocalTimeZone()).toString();

export const deserialize = evolve({
  tasks: t => t.map(evolve({ date: deserializeDateTime })),
  board: evolve({ dateRange: map(deserializeDate) })
}) as (json: typeof entities2023) => BoardData;

export const serialize = evolve({
  tasks: t => t.map(evolve({ date: serializeDateTime })),
  board: evolve({ dateRange: map(serializeDate) })
}) as (data: BoardData) => typeof entities2023;

export const {
  crops: crops2023,
  locations: locations2023,
  operations: operations2023,
  plants: plants2023,
  tasks: tasks2023,
  board: boardInfo2023,
} = deserialize(entities2023) as BoardData;

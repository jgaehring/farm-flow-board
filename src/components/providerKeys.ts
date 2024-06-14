import type { InjectionKey, Ref, WritableComputedRef } from "vue";
import type {
  CropTerm, LocationResource, LogResource, OperationTerm, PlantResource,
} from '@/data/resources';
import type { TaskMatrix } from '@/canvas/board';

export const matrixKey = Symbol() as InjectionKey<Ref<TaskMatrix>>;
export const tasksKey = Symbol() as InjectionKey<Ref<LogResource[]>>;
export const locationsKey = Symbol() as InjectionKey<Ref<LocationResource[]>>;
export const plantsKey = Symbol() as InjectionKey<Ref<PlantResource[]>>;
export const dateRangeKey = Symbol() as InjectionKey<Ref<Date[]>>;
export const operationsKey = Symbol() as InjectionKey<Ref<OperationTerm[]>>;
export const cropsKey = Symbol() as InjectionKey<Ref<CropTerm[]>>;
export const boardIdKey = Symbol() as InjectionKey<Ref<string>>;
export const indexPositionKey = Symbol() as InjectionKey<Ref<{ x: number, y: number}>>;
export const isDarkKey = Symbol() as InjectionKey<WritableComputedRef<boolean>>;
export type UpdateValue = Partial<LogResource>|Partial<PlantResource>;
export const emitBoardUpdateKey = Symbol() as InjectionKey<(value: UpdateValue) => void>;

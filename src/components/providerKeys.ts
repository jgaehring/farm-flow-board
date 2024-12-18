import type { InjectionKey, Ref, WritableComputedRef } from "vue";
import type {
  BoardInfo, CropTerm, LocationResource, LogResource, OperationTerm,
  PartialResource, PlantResource,
} from '@/data/resources';
import type { TaskMatrix } from '@/canvas/board';

export const matrixKey = Symbol() as InjectionKey<Ref<TaskMatrix>>;
export const tasksKey = Symbol() as InjectionKey<Ref<LogResource[]>>;
export const locationsKey = Symbol() as InjectionKey<Ref<LocationResource[]>>;
export const plantsKey = Symbol() as InjectionKey<Ref<PlantResource[]>>;
export const dateSequenceKey = Symbol() as InjectionKey<Ref<Date[]>>;
export const dateRangeKey = Symbol() as InjectionKey<Ref<[Date, Date]>>;
export const operationsKey = Symbol() as InjectionKey<Ref<OperationTerm[]>>;
export const cropsKey = Symbol() as InjectionKey<Ref<CropTerm[]>>;
export const boardInfoKey = Symbol() as InjectionKey<Ref<BoardInfo|null>>;
export const boardsKey = Symbol() as InjectionKey<Ref<BoardInfo[]>>;
export const indexPositionKey = Symbol() as InjectionKey<Ref<{ x: number, y: number}>>;
export const isDarkKey = Symbol() as InjectionKey<WritableComputedRef<boolean>>;
export const emitBoardUpdateKey = Symbol() as InjectionKey<(value: PartialResource) => void>;
export const emitBoardDeleteKey = Symbol() as InjectionKey<(value: PartialResource) => void>;

import type { InjectionKey, Ref, WritableComputedRef } from 'vue';
import type {
  BoardInfo, CropTerm, LocationResource, LogResource, OperationTerm,
  PartialResource, PlantResource,
} from '@/data/resources';
import type { TaskMatrix } from '@/canvas/board';

export const matrixKey = Symbol('matrix') as InjectionKey<Ref<TaskMatrix>>;
export const tasksKey = Symbol('tasks') as InjectionKey<Ref<LogResource[]>>;
export const locationsKey = Symbol('locations') as InjectionKey<Ref<LocationResource[]>>;
export const plantsKey = Symbol('plants') as InjectionKey<Ref<PlantResource[]>>;
export const dateSequenceKey = Symbol('dateSequence') as InjectionKey<Ref<Date[]>>;
export const dateRangeKey = Symbol('dateRange') as InjectionKey<Ref<[Date, Date]>>;
export const operationsKey = Symbol('operations') as InjectionKey<Ref<OperationTerm[]>>;
export const cropsKey = Symbol('crops') as InjectionKey<Ref<CropTerm[]>>;
export const boardInfoKey = Symbol('boardInfo') as InjectionKey<Ref<BoardInfo|null>>;
export const boardsKey = Symbol('boards') as InjectionKey<Ref<BoardInfo[]>>;
export const indexPositionKey = Symbol('indexPosition') as InjectionKey<Ref<{ x: number, y: number}>>;
export const isDarkKey = Symbol('isDark') as InjectionKey<WritableComputedRef<boolean>>;
export const emitBoardUpdateKey = Symbol('emitBoardUpdate') as InjectionKey<(value: PartialResource) => void>;
export const emitBoardDeleteKey = Symbol('emitBoardDelete') as InjectionKey<(value: PartialResource) => void>;

import type { InjectionKey, Ref, WritableComputedRef } from "vue";
import type { LocationResource, OperationTerm, TaskMatrix } from '@/data/resources';

export const tasksKey = Symbol() as InjectionKey<Ref<TaskMatrix>>;
export const locationsKey = Symbol() as InjectionKey<LocationResource[]>;
export const dateRangeKey = Symbol() as InjectionKey<Ref<Date[]>>;
export const operationsKey = Symbol() as InjectionKey<OperationTerm[]>;
export const boardIdKey = Symbol() as InjectionKey<Ref<string>>;
export const indexPositionKey = Symbol() as InjectionKey<Ref<{ x: number, y: number}>>;
export const isDarkKey = Symbol() as InjectionKey<WritableComputedRef<boolean>>;

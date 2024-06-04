import type { InjectionKey, Ref, WritableComputedRef } from "vue";
import type { ActionRecords, ActionType, LocationRecord } from "@/data/boardSampleData";

export const actionRecordsKey = Symbol() as InjectionKey<Ref<ActionRecords>>;
export const locationRecordsKey = Symbol() as InjectionKey<LocationRecord[]>;
export const dateRangeKey = Symbol() as InjectionKey<Ref<Date[]>>;
export const actionTypesKey = Symbol() as InjectionKey<ActionType[]>;
export const boardIdKey = Symbol() as InjectionKey<Ref<string>>;
export const indexPositionKey = Symbol() as InjectionKey<Ref<{ x: number, y: number}>>;
export const isDarkKey = Symbol() as InjectionKey<WritableComputedRef<boolean>>;

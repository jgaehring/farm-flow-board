import type { InjectionKey, Ref } from "vue";
import type { ActionRecords, ActionType, LocationRecord } from "@/data/boardSampleData";

export const actionRecordsKey = Symbol() as InjectionKey<Ref<ActionRecords>>;
export const locationRecordsKey = Symbol() as InjectionKey<LocationRecord[]>;
export const dateRangeKey = Symbol() as InjectionKey<Ref<Date[]>>;
export const actionTypesKey = Symbol() as InjectionKey<ActionType[]>;

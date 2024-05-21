import type { InjectionKey } from "vue";
import type { ActionRecords, ActionType, LocationRecord } from "@/data/boardSampleData";

export const actionRecordsKey = Symbol() as InjectionKey<ActionRecords>;
export const locationRecordsKey = Symbol() as InjectionKey<LocationRecord[]>;
export const dateRangeKey = Symbol() as InjectionKey<Date[]>;
export const actionTypesKey = Symbol() as InjectionKey<ActionType[]>;

export enum EntityType {
  Asset = 'asset',
  Log = 'log',
  Plan = 'plan',
  TaxonomyTerm = 'taxonomy_term',
}

export enum Asset {
  Land = 'asset--land',
  Plant = 'asset--plant',
}

export enum Log {
  Activity = 'log--activity',
  Harvest = 'log--harvest',
  Input = 'log--input',
  Seeding = 'log--seeding',
}

export enum Plan {
  FarmFlow = 'plan--farm_flow_board',
}

export enum Term {
  Plant = 'taxonomy_term--plant',
  StandardOperatingProcedure = 'taxonomy_term--standard_operating_procedure',
}

type Entity = Asset|Log|Plan|Term;

export interface ResourceIdentifier {
  id: string,
  type: Entity,
}
export interface Resource extends ResourceIdentifier {
  name: string,
}
export type PartialResource<R> = ResourceIdentifier & Partial<R>;

export type PartialLog = PartialResource<LogResource>;
export type PartialAsset = PartialResource<AssetResource>;
export type PartialPlan = PartialResource<PlanResource>;
export type PartialTerm = PartialResource<TaxonomyTerm>;

export interface TaxonomyTerm extends Resource {
  type: Term,
  name: string,
}

export interface CropIdentifier extends ResourceIdentifier {
  type: Term.Plant,
}
export interface CropTerm extends TaxonomyTerm {
  type: Term.Plant,
  color: string,
}

export interface OperationIdentifier extends ResourceIdentifier {
  type: Term.StandardOperatingProcedure,
}
export interface OperationTerm extends TaxonomyTerm {
  type: Term.StandardOperatingProcedure,
  log_type: Log|null,
  color: string,
}

export interface AssetResource extends ResourceIdentifier {
  type: Asset,
  name: string,
}
export interface LocationIdentifier extends ResourceIdentifier {
  type: Asset.Land,
}
export interface LocationResource extends AssetResource {
  type: Asset.Land,
}
export interface PlantIdentifier extends ResourceIdentifier {
  type: Asset.Plant,
}
export interface PlantResource extends AssetResource {
  type: Asset.Plant,
  crop: CropIdentifier,
  location: LocationIdentifier,
}

export interface LogIdentifier extends ResourceIdentifier {
  type: Log,
}
export interface LogResource extends Resource {
  type: Log,
  date: Date,
  location: LocationIdentifier | null,
  operation: OperationIdentifier | null,
  plant: PlantIdentifier | null,
  notes: string,
}

export interface PlanResource extends Resource {
  type: Plan,
}

export interface PlanIdentifier extends ResourceIdentifier {
  type: Plan,
}

export interface BoardInfo extends PlanResource {
  type: Plan.FarmFlow,
  dateRange: [Date, Date],
  crops: PlantIdentifier[],
}

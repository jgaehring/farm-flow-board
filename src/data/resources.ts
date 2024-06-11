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
  FarmFlow = 'plan--farm_flow',
}

export enum Term {
  Plant = 'taxonomy_term--plant',
  StandardOperatingProcedure = 'taxonomy_term--standard_operating_procedure',
}

type Entity = Asset|Log|Plan|Term;

interface ResourceIdentifier {
  id: string,
  type: Entity,
}
interface Resource extends ResourceIdentifier {
  name: string,
}

interface TaxonomyTerm extends Resource {
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
  location: LocationIdentifier,
  operation: OperationIdentifier,
  plant: PlantIdentifier,
  notes: string,
}

export interface BoardInfo extends Resource {
  type: Plan.FarmFlow,
  dateRange: [Date, Date],
  operations: OperationIdentifier[],
  crops: CropIdentifier
}

export type OperationsByDate = {
  date: Date,
  operations: OperationTerm[],
};
export type DatesByLocation = {
  id: string,
  name: string,
  crop: CropTerm|null,
  dates: OperationsByDate[]
};
export type TaskMatrix = DatesByLocation[];

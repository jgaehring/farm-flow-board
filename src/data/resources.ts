export type UUID = `${string}-${string}-${string}-${string}-${string}`;

type EntityNameAsset = 'asset';
type EntityNameLog = 'log';
type EntityNamePlan = 'plan';
type EntityNameTerm = 'taxonomy_term';
type EntityName =
  | EntityNameAsset
  | EntityNameLog
  | EntityNamePlan
  | EntityNameTerm;

export type ResourceType<E extends EntityName, B extends string> = `${E}--${B}`;

/**
 * ASSETS:
 *  - Land
 *  - Plant
 */
export type AssetBundle =
  | 'land'
  | 'plant';
export type AssetType<B extends AssetBundle = AssetBundle> =
  ResourceType<EntityNameAsset, B>;
export type AssetIdentifier<T extends AssetType = AssetType> = {
  id: UUID;
  type: T;
};
export type AssetProperties = { name: string };
export type AssetResource = AssetIdentifier & AssetProperties;

export type LocationIdentifier = AssetIdentifier<'asset--land'>;
export type LocationResource = LocationIdentifier & AssetProperties;
export type LocationPartial = LocationIdentifier & Partial<AssetProperties>;

export type PlantIdentifier = AssetIdentifier<'asset--plant'>;
export type PlantProperties = AssetProperties & {
  crop: CropIdentifier;
  location: AssetIdentifier;
};
export type PlantResource = PlantIdentifier & PlantProperties;
export type PlantPartial = PlantIdentifier & Partial<PlantProperties>;

/**
 * LOGS:
 *  - Activity
 *  - Harvest
 *  - Input
 *  - Seeding
 */
export type LogBundle =
  | 'activity'
  | 'harvest'
  | 'input'
  | 'seeding';
export type LogType<B extends LogBundle = LogBundle> =
  ResourceType<EntityNameLog, B>;
export type LogIdentifier<T extends LogType = LogType> = {
  id: UUID;
  type: T;
};
export type LogProperties = {
  name: string;
  date: Date;
  location: LocationIdentifier | null;
  operation: OperationIdentifier | null;
  plant: PlantIdentifier | null;
  notes: string;
}
export type LogResource = LogIdentifier & LogProperties;

/**
 * PLANS:
 *  - Farm Flow Board
 */
export type PlanBundle =
  | 'crop_plan'
  | 'farm_flow_board';
export type PlanType<B extends PlanBundle = PlanBundle> =
  ResourceType<EntityNamePlan, B>;
export type PlanIdentifier<T extends PlanType = PlanType> = {
  id: UUID;
  type: T;
};
export type PlanProperties = { name: string };
export type PlanResource = PlanIdentifier & PlanProperties;

export type BoardIdentifier = PlanIdentifier<'plan--farm_flow_board'>;
export type BoardProperties = PlanProperties & {
  dateRange: [Date, Date];
  crops: PlantIdentifier[];
}
export type BoardInfo = BoardIdentifier & BoardProperties;
export type BoardInfoPartial = BoardIdentifier & Partial<BoardProperties>;

/**
 * TAXONOMY TERMS
 *  - Crop (plant)
 *  - Operation
 */
export type TermBundle =
  | 'plant'
  | 'standard_operating_procedure';
export type TermType<B extends TermBundle = TermBundle> =
  ResourceType<EntityNameTerm, B>;
export type TermIdentifier<T extends TermType = TermType> = {
  id: UUID;
  type: T;
};
export type TermProperties = { name: string };
export type TaxonomyTerm = TermIdentifier & TermProperties;

export type CropIdentifier = TermIdentifier<'taxonomy_term--plant'>;
export type CropProperties = TermProperties & { color: string };
export type CropTerm = CropIdentifier & CropProperties;
export type CropPartial = CropIdentifier & Partial<CropProperties>;

export type OperationIdentifier = TermIdentifier<'taxonomy_term--standard_operating_procedure'>;
export type OperationProperties = TermProperties & {
  log_type: LogType|null;
  color: string;
}
export type OperationTerm = OperationIdentifier & OperationProperties;
export type OperationPartial = OperationIdentifier & Partial<OperationProperties>;

/**
 * GENERALIZED RESOURCES
 */
export type ResourceIdentifier =
  | AssetIdentifier
  | LogIdentifier
  | PlanIdentifier
  | TermIdentifier;
export type Resource = ResourceIdentifier & { name: string };

export type PartialAsset = LocationPartial|PlantPartial;
export type PartialLog = LogIdentifier & Partial<LogProperties>;
export type PartialPlan = BoardInfoPartial;
export type PartialTerm = CropPartial|OperationPartial;
export type PartialResource = PartialAsset|PartialLog|PartialPlan|PartialTerm;

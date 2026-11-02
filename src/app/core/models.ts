export type DataType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'unknown';
export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'doughnut' | 'scatter' | 'histogram' | 'kpi';
export type Aggregate = 'sum' | 'average' | 'count' | 'minimum' | 'maximum' | 'median';
export type Delimiter = 'auto' | ',' | ';' | '\t' | '|';

export interface DatasetColumn {
  id: string;
  name: string;
  dataType: DataType;
  nullable: boolean;
  uniqueCount: number;
  missingCount: number;
}

export interface Dataset {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  columns: DatasetColumn[];
  rows: Record<string, string>[];
  delimiter: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalculatedField {
  id: string;
  name: string;
  formula: string;
  dataType: DataType;
  createdAt: string;
}

export interface Visualization {
  id: string;
  type: ChartType;
  title: string;
  dimension: string;
  measure: string;
  aggregate: Aggregate;
  createdAt: string;
  updatedAt: string;
}

export interface Dashboard {
  id: string;
  name: string;
  visualizationIds: string[];
  presentationMode: boolean;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  datasetId: string;
  filters: DatasetFilter[];
  calculatedFields: CalculatedField[];
  visualizations: Visualization[];
  dashboard: Dashboard;
  createdAt: string;
  updatedAt: string;
}

export interface DatasetFilter {
  id: string;
  column: string;
  operator:
    | 'contains' | 'does-not-contain' | 'equals' | 'does-not-equal' | 'starts-with' | 'ends-with'
    | 'greater-than' | 'greater-or-equal' | 'less-than' | 'less-or-equal' | 'between'
    | 'before' | 'after' | 'on' | 'is-true' | 'is-false' | 'is-empty' | 'is-not-empty';
  value: string;
}

export interface QualityIssue {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  count: number;
  column?: string;
  rows: number[];
}

export interface NumericProfile {
  count: number;
  missing: number;
  unique: number;
  min: number;
  max: number;
  sum: number;
  average: number;
  median: number;
  standardDeviation: number;
  p25: number;
  p75: number;
}

export interface ImportOptions {
  delimiter: Delimiter;
  firstRowHeaders: boolean;
  trimWhitespace: boolean;
}

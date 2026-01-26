
export interface ExtractionData {
  contrato: string;
  processo: string;
  objeto: string;
}

export interface MeasurementItem {
  a: string; // Column A
  b: string; // Column B (Code)
  c: string; // Column C (Description)
  valor: number;
}

export interface ReportHierarchy {
  grandparent?: MeasurementItem;
  parent?: MeasurementItem;
  child: MeasurementItem;
}

export interface PhotoData {
  itemId: string;
  urls: string[];
}

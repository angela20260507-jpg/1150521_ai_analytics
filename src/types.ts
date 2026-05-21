export interface AnalysisResponse {
  result: string;
}

export interface AnalysisError {
  error: string;
}

export interface TablePreviewData {
  headers: string[];
  rows: string[][];
}

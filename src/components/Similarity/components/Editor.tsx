import { ChartType, MetricType, ProjectionType, ScaleType } from "../constants";

type SelectedCountriesMap = Record<string, boolean>;

export type ChartOptions = {
  chartType: ChartType;
  metric: MetricType;
  isCumulative: boolean;
  alignAt: number;
  showDataLabels: boolean;
  title: string;
  dayInterval: number;
  selectedRegions: SelectedCountriesMap;
  scale: ScaleType;
  predictionDays: number;
  projectionType: ProjectionType;
  epsilon: number;
  perplexity: number;
  iterations: number;
  timeserieSlice: number;
  spread: number;
  neighbors: number;
  minDist: number;
  validatePrediction?: boolean;
};

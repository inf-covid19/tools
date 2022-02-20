export type ScaleType = "linear" | "log";
export type ChartType = "heatmap" | "bar" | "area" | "line" | "scatter";
export type MetricType = "confirmed" | "deaths";
export type ProjectionType = "tsne" | "umap";

export const DEFAULT_OPTIONS = {
  chartType: "heatmap",
  metric: "confirmed",
  showDataLabels: false,
  isCumulative: true,
  title: "Timeline Plots of Coronavirus Data",
  dayInterval: 30,
  selectedRegions: {},
  alignAt: 0,
  scale: "log" as ScaleType,
  predictionDays: 7,
  projectionType: "umap" as ProjectionType,
  epsilon: 5,
  perplexity: 10,
  iterations: 5000,
  timeserieSlice: 20,
  spread: 5,
  neighbors: 2,
  minDist: 0.1,
};

export const DEFAULT_COUNTRIES = [
  '2f37bf69',
  '3e2d4144',
  '59a13ceb',
  '59d3b85f',
  '9164293b',
  'c39bfe6c',
  'f90dfca0',
];

export const DATA_SOURCES = [
  {
    name: "ECDC",
    url: "https://www.ecdc.europa.eu/en/publications-data/download-todays-data-geographic-distribution-covid-19-cases-worldwide",
  },
  { name: "Brasil.IO", url: "https://brasil.io/dataset/covid19/caso" },
  {
    name: "PHAS",
    url: "https://www.folkhalsomyndigheten.se/smittskydd-beredskap/utbrott/aktuella-utbrott/covid-19/aktuellt-epidemiologiskt-lage",
  },
  { name: "NY Times", url: "https://github.com/nytimes/covid-19-data" },
  { name: "ISC", url: "https://covid19.isciii.es/" },
  {
    name: "PHE",
    url: "https://www.gov.uk/government/publications/covid-19-track-coronavirus-cases",
  },
];

export const PLACE_TYPE_LABEL_MAPPING: Record<string, string> = {
  state: "States",
  city: "Cities",
  autonomous_community: "Autonomous Communities",
  country: "Countries",
  county: "Counties",
  nhsr: "NHSRs",
  utla: "UTLAs",
  health_board: "Health Boards",
  lgd: "LGDs",
  unknown: "Other regions",
  region: "Regions",
  departamento: "Departments",
  provincia: "Provinces",
  province: "Provinces",
  territory: "Territories",
  lower_tier_local_authority: "LTLAs",
  administrative_area_level_2: "Administrative Area Level 2",
  administrative_area_level_3: "Administrative Area Level 3",
};

export const SIMILARITY_API = `${process.env.REACT_APP_SIMILARITY_API}`;

export const PREDICTIONS_API = `${process.env.REACT_APP_PREDICTIONS_API}`;

export const AUTOCOVS_API = `http://localhost:8000`;

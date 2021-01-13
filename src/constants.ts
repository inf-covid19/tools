export type ScaleType = "linear" | "log";
export type ChartType = "heatmap" | "bar" | "area" | "line" | "scatter";
export type MetricType = "cases" | "deaths";
export type ProjectionType = "tsne" | "umap";

export const DEFAULT_OPTIONS = {
  chartType: "heatmap",
  metric: "cases",
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
  "Brazil",
  "United States",
  "United Kingdom",
  "China",
  "Sweden",
  "Spain",
  "Germany",
  "France",
  "Canada",
  "Portugal",
  "Italy",
  "South Korea",
  "Iran",
  "Israel",
  "Netherlands",
  "Peru",
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
};

export const SIMILARITY_API = `${process.env.REACT_APP_SIMILARITY_API}`;

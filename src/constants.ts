export const DEFAULT_OPTIONS = {
  chartType: 'heatmap',
  metric: 'cases',
  showDataLabels: false,
  isCumulative: true,
  title: 'Heatmap of Coronavirus Data',
  dayInterval: 30,
  selectedCountries: {},
  alignAt: 0,
}

export const DEFAULT_COUNTRIES = [
  "Brazil",
  "United States of America",
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
  "Peru"
];

export const DATA_SOURCES = [
  {
    name: "ECDC",
    url:
      "https://www.ecdc.europa.eu/en/publications-data/download-todays-data-geographic-distribution-covid-19-cases-worldwide"
  },
  { name: "Brasil.IO", url: "https://brasil.io/dataset/covid19/caso" },
  {
    name: "PHAS",
    url:
      "https://www.folkhalsomyndigheten.se/smittskydd-beredskap/utbrott/aktuella-utbrott/covid-19/aktuellt-epidemiologiskt-lage"
  },
  { name: "NY Times", url: "https://github.com/nytimes/covid-19-data" },
  { name: "ISC", url: "https://covid19.isciii.es/" },
  {
    name: "PHE",
    url:
      "https://www.gov.uk/government/publications/covid-19-track-coronavirus-cases"
  }
];

import { get } from "lodash";

const customLabels = {
  deaths: "Total Deaths",
  deaths_by_100k: "Total Deaths per 100k inhab.",
  deaths_daily: "Daily Deaths",
  deaths_by_100k_daily: "Daily Deaths per 100k inhab.",
  deaths_daily_7d: "Deaths (7-day moving avg.)",
  deaths_by_100k_daily_7d: "Deaths per 100k inhab. (7-day moving avg.)",
  deaths_daily_14d: "Deaths (14-day moving avg.)",
  deaths_by_100k_daily_14d: "Deaths per 100k inhab. (14-day moving avg.)",
  deaths_daily_21d: "Deaths (21-day moving avg.)",
  deaths_by_100k_daily_21d: "Deaths per 100k inhab. (21-day moving avg.)",
  confirmed: "Total Cases",
  confirmed_by_100k: "Total Cases per 100k inhab.",
  confirmed_daily: "Daily Cases",
  confirmed_by_100k_daily: "Daily Cases per 100k inhab.",
  confirmed_daily_7d: "Cases (7-day moving avg.)",
  confirmed_by_100k_daily_7d: "Cases per 100k inhab. (7-day moving avg.)",
  confirmed_daily_14d: "Cases (14-day moving avg.)",
  confirmed_by_100k_daily_14d: "Cases per 100k inhab. (14-day moving avg.)",
  confirmed_daily_21d: "Cases (21-day moving avg.)",
  confirmed_by_100k_daily_21d: "Cases per 100k inhab. (21-day moving avg.)",
};

export const titleCase = (wordRaw: string) => {
  const word = get(customLabels, wordRaw, wordRaw);

  return word.slice(0, 1).toUpperCase() + word.slice(1);
};

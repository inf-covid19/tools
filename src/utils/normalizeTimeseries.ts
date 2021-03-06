import { DSVRowArray, DSVRowString } from "d3";
import { differenceInDays, eachDayOfInterval, isAfter, isBefore, parse, startOfDay, subDays } from "date-fns";
import get from "lodash/get";
import orderBy from "lodash/orderBy";
import { getByRegionId } from "./metadata";

const PLACE_TYPE_COLUMN_MAPPING: Record<string, string> = {
  state: "state",
  city: "city",
  county: "county",
  territory: "state",
  province: 'province',
  country: 'country',
};

const REGION_CUSTOM_CONFIG = {
  Brazil: {
    columns: {
      cases: "confirmed",
    },
  },
  Canada: {
    place_types: {
      territory: "province",
    },
  },
  Ecuador:{
    place_types: {
      unknown: 'province'
    }
  },
};

const parseDate = (row: DSVRowString, country: string, isCountry: boolean) => {
  const dateColumn = get(REGION_CUSTOM_CONFIG, [country, "columns", "date"], isCountry ? "dateRep" : "date");
  const dateFormat = get(REGION_CUSTOM_CONFIG, [country, "date", "format"], "yyyy-MM-dd");

  return parse(row[dateColumn]!, dateFormat, startOfDay(new Date()));
};

export type TimeseriesRow = {
  date: Date;
  cases: number;
  cases_daily: number;
  deaths: number;
  deaths_daily: number;
};

export function alignTimeseries(timeseries: TimeseriesRow[], earliestDate: Date) {
  if (timeseries.length === 0) {
    return [];
  }

  if (!isBefore(earliestDate, timeseries[0].date)) {
    return timeseries.filter((d) => isAfter(d.date, subDays(earliestDate, 1)));
  }

  const missingDays = eachDayOfInterval({
    start: earliestDate,
    end: timeseries[0].date,
  });

  return [
    ...missingDays.slice(0, -1).map((date) => ({
      date,
      cases: 0,
      cases_daily: 0,
      deaths: 0,
      deaths_daily: 0,
    })),
    ...timeseries,
  ];
}

export default function normalizeTimeseries(regionId: string, timeseriesRaw: DSVRowArray, regionData: ReturnType<typeof getByRegionId>) {
  const { country = "countries", isCountry } = regionData;

  let timeseries: DSVRowString[] = timeseriesRaw;

  // filtering based on region, because it can have multiple regions in the same csv
  if (!isCountry) {
    timeseries = timeseries.filter((row) => regionData.place_type === row.place_type && row[get(REGION_CUSTOM_CONFIG, [country, 'place_types', row.place_type!], get(PLACE_TYPE_COLUMN_MAPPING, row.place_type!, "region"))] === regionData.name);
  }

  // ensure order (more recent sits at the end of the timeseries)
  timeseries = orderBy(timeseries, (row) => parseDate(row, country, isCountry));

  const casesColumn = isCountry ? "cases" : get(REGION_CUSTOM_CONFIG, [country, "columns", "cases"], "cases");
  const deathsColumn = isCountry ? "deaths" : get(REGION_CUSTOM_CONFIG, [country, "columns", "deaths"], "deaths");

  let prevDate: Date;
  let totalCases = 0;
  let totalDeaths = 0;

  // normalize timeseries (include cases, cases_daily, deaths, deaths_daily)
  const data: TimeseriesRow[] = [];
  timeseries.forEach((row) => {
    const date = parseDate(row, country, isCountry);

    if (prevDate && differenceInDays(date, prevDate) > 1) {
      const missingInterval = eachDayOfInterval({
        start: prevDate,
        end: date,
      });
      missingInterval.slice(1, missingInterval.length - 1).forEach((missingDate) => {
        data.push({
          date: missingDate,
          cases: totalCases,
          cases_daily: 0,
          deaths: totalDeaths,
          deaths_daily: 0,
        });
      });
    }

    const cases = isCountry ? totalCases + Number(get(row, casesColumn, 0)) : Number(get(row, casesColumn, totalCases));
    const cases_daily = Math.max(0, cases - totalCases);

    const deaths = isCountry ? totalDeaths + Number(get(row, deathsColumn, 0)) : Number(get(row, deathsColumn, totalDeaths));
    const deaths_daily = Math.max(0, deaths - totalDeaths);

    if (cases < totalCases || deaths < totalDeaths) {
      data.forEach((entry, index) => {
        if (entry.cases > cases) {
          data[index].cases = cases;
          data[index].cases_daily = Math.max(0, cases - get(data, [index - 1, "cases"], 0));
        }

        if (entry.deaths > deaths) {
          data[index].deaths = deaths;
          data[index].deaths_daily = Math.max(0, deaths - get(data, [index - 1, "deaths"], 0));
        }
      });
    }

    data.push({ date, cases, cases_daily, deaths, deaths_daily });

    totalCases = cases;
    totalDeaths = deaths;
    prevDate = date;
  });

  return data;
}

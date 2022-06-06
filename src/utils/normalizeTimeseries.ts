import { eachDayOfInterval, isAfter, isBefore, subDays } from "date-fns";
import {first, mapValues }from 'lodash'



export type TimeseriesRow = Record<string, number> & {
  date: Date;
};

export function alignTimeseries(timeseries: TimeseriesRow[], earliestDate: Date): TimeseriesRow[] {
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

  const { date, ...rest } = first(timeseries)!;

  return [
    ...missingDays.slice(0, -1).map((date) => {
      return ({
        date,
        ...mapValues(rest, () => 0)
      }) as TimeseriesRow;
    }),
    ...timeseries,
  ];
}

// export default function normalizeTimeseries(regionId: string, timeseriesRaw: DSVRowArray, regionData: ReturnType<typeof getByRegionId>) {
//   const { country = "countries", isCountry } = regionData;

//   let timeseries: DSVRowString[] = timeseriesRaw;

//   // filtering based on region, because it can have multiple regions in the same csv
//   if (!isCountry) {
//     timeseries = timeseries.filter((row) => regionData.place_type === row.place_type && row[get(REGION_CUSTOM_CONFIG, [country, 'place_types', row.place_type!], get(PLACE_TYPE_COLUMN_MAPPING, row.place_type!, "region"))] === regionData.name);
//   }

//   // ensure order (more recent sits at the end of the timeseries)
//   timeseries = orderBy(timeseries, (row) => parseDate(row, country, isCountry));

//   const casesColumn = isCountry ? "confirmed" : get(REGION_CUSTOM_CONFIG, [country, "columns", "confirmed"], "confirmed");
//   const deathsColumn = isCountry ? "deaths" : get(REGION_CUSTOM_CONFIG, [country, "columns", "deaths"], "deaths");

//   let prevDate: Date;
//   let totalCases = 0;
//   let totalDeaths = 0;

//   // normalize timeseries (include cases, cases_daily, deaths, deaths_daily)
//   const data: TimeseriesRow[] = [];
//   timeseries.forEach((row) => {
//     const date = parseDate(row, country, isCountry);

//     if (prevDate && differenceInDays(date, prevDate) > 1) {
//       const missingInterval = eachDayOfInterval({
//         start: prevDate,
//         end: date,
//       });
//       missingInterval.slice(1, missingInterval.length - 1).forEach((missingDate) => {
//         data.push({
//           date: missingDate,
//           cases: totalCases,
//           cases_daily: 0,
//           deaths: totalDeaths,
//           deaths_daily: 0,
//         });
//       });
//     }

//     const cases = isCountry ? totalCases + Number(get(row, casesColumn, 0)) : Number(get(row, casesColumn, totalCases));
//     const cases_daily = Math.max(0, cases - totalCases);

//     const deaths = isCountry ? totalDeaths + Number(get(row, deathsColumn, 0)) : Number(get(row, deathsColumn, totalDeaths));
//     const deaths_daily = Math.max(0, deaths - totalDeaths);

//     if (cases < totalCases || deaths < totalDeaths) {
//       data.forEach((entry, index) => {
//         if (entry.cases > cases) {
//           data[index].cases = cases;
//           data[index].cases_daily = Math.max(0, cases - get(data, [index - 1, "confirmed"], 0));
//         }

//         if (entry.deaths > deaths) {
//           data[index].deaths = deaths;
//           data[index].deaths_daily = Math.max(0, deaths - get(data, [index - 1, "deaths"], 0));
//         }
//       });
//     }

//     data.push({ date, cases, cases_daily, deaths, deaths_daily });

//     totalCases = cases;
//     totalDeaths = deaths;
//     prevDate = date;
//   });

//   return data;
// }

import { findLastIndex } from "lodash";

// The upstream data stopped updating (the last report of any location is from October 2024, most
// stopped in 2023), but the API still returns one row per day until today, repeating the last totals.
const RAW_COLUMNS = ["confirmed", "deaths", "vaccines", "people_vaccinated", "people_fully_vaccinated"];

export function trimPaddedRecords<T extends Record<string, any>>(records: T[], columns: string[] = RAW_COLUMNS): T[] {
  const isPadding = (record: T, index: number) => index > 0 && columns.every((column) => record[column] === records[index - 1][column]);

  return records.slice(0, findLastIndex(records, (record, index) => !isPadding(record, index)) + 1);
}

// The waves are computed by the API over the padded rows, so they can go past the real data.
export function clampPeriods<T extends { start: number; end: number }>(periods: T[], lastTime: number): T[] {
  return periods.filter((period) => period.start < lastTime).map((period) => ({ ...period, end: Math.min(period.end, lastTime) }));
}

// Locations stopped at different dates, so the last date with data for all of them is the one that
// keeps every location visible and comparable in a fixed window.
export function getCommonEndDate(dataByRegion: Record<string, Array<{ date: Date }>>): Date | undefined {
  const endTimes = Object.values(dataByRegion)
    .filter((rows) => rows.length > 0)
    .map((rows) => rows[rows.length - 1].date.getTime());

  return endTimes.length > 0 ? new Date(Math.min(...endTimes)) : undefined;
}

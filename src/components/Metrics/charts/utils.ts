import { isWithinInterval } from "date-fns";
import { TimeseriesRow } from "../../../utils/normalizeTimeseries";

export type DateRange = [Date, Date];

export function filterByDateRange(timeseries: TimeseriesRow[], dateRange?: DateRange) {
  if (!dateRange) {
    return timeseries;
  }

  const [start, end] = dateRange;

  return timeseries.filter((x) => isWithinInterval(x.date, { start, end }));
}

export function filterSeriesByDateRange(series: { x: number; y: number }[], dateRange?: DateRange) {
  if (!dateRange) {
    return series;
  }

  const [start, end] = dateRange;

  return series.filter((x) => isWithinInterval(x.x, { start, end }));
}

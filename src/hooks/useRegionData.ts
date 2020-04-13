import sortBy from "lodash/sortBy";
import { useEffect, useMemo, useState } from "react";
import { getRegionData } from "../store";
import normalizeTimeseries, { TimeseriesRow } from "../utils/normalizeTimeseries";

export default function useRegionData(regionIds: string[]) {
  const [data, setData] = useState<Record<string, TimeseriesRow[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const triggerUpdate = useMemo(() => {
    return sortBy(regionIds).join("|");
  }, [regionIds]);

  useEffect(() => {
    let cancelled = false;

    setError(null);
    setData(null);
    setLoading(true);

    Promise.all(regionIds.map((id) => getRegionData(id)))
      .then((results) => {
        if (cancelled) return;

        const data: Record<string, TimeseriesRow[]> = {};
        results.forEach((res, index) => {
          data[regionIds[index]] = normalizeTimeseries(regionIds[index], res);
        });
        setData(data);
      })
      .catch((err) => {
        if (cancelled) return;

        console.error("Failed to fetch region data:", err);
        setError(err);
      })
      .finally(() => {
        if (cancelled) return;

        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [triggerUpdate]); // eslint-disable-line

  return useMemo(() => ({ data, loading, error }), [data, loading, error]);
}

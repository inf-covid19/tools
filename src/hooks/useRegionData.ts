import { DSVRowArray } from "d3";
import sortBy from "lodash/sortBy";
import { useEffect, useMemo, useState } from "react";
import { getRegionData } from "../store";

export default function useRegionData(regionIds: string[]) {
  const [data, setData] = useState<Record<string, DSVRowArray> | null>(null);
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

        const data: Record<string, DSVRowArray> = {};
        results.forEach((res, index) => {
          data[regionIds[index]] = res;
        });
        setData(data);
      })
      .catch((err) => {
        if (cancelled) return;

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

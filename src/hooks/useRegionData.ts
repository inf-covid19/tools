import sortBy from "lodash/sortBy";
import { useEffect, useMemo, useState } from "react";
import { getRegionData } from "../store";
import normalizeTimeseries, { TimeseriesRow } from "../utils/normalizeTimeseries";
import useMetadata from "./useMetadata";
import { getFileByRegionId, getByRegionId } from "../utils/metadata";
import { isEmpty } from "lodash";

export default function useRegionData(regionIds: string[]) {
  const [data, setData] = useState<Record<string, TimeseriesRow[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: metadata } = useMetadata();

  const triggerUpdate = useMemo(() => {
    return sortBy([...regionIds]).join("|");
  }, [regionIds]);

  useEffect(() => {
    let cancelled = false;

    if (isEmpty(metadata)) return;

    setLoading(true);
    setError(null);
    setData(null);

    const regionFileMapped: Record<string, string[]> = {};
    regionIds.forEach((id) => {
      const regionFile = getFileByRegionId(metadata, id);
      regionFileMapped[regionFile] = [...(regionFileMapped[regionFile] || []), id];
    });

    const regionFiles = Object.keys(regionFileMapped);

    Promise.all(regionFiles.map((file) => getRegionData(file)))
      .then((results) => {
        if (cancelled) return;

        const data: Record<string, TimeseriesRow[]> = {};
        results.forEach((res, index) => {
          const ids = regionFileMapped[regionFiles[index]];
          ids.forEach((regionId) => {
            data[regionId] = normalizeTimeseries(regionId, res, getByRegionId(metadata, regionId));
          });
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
  }, [triggerUpdate, metadata]); // eslint-disable-line

  return useMemo(() => ({ data, loading, error }), [data, loading, error]);
}

import { csv } from "d3";
import { groupBy } from "lodash";
import sortBy from "lodash/sortBy";
import { useCallback, useMemo, useRef } from "react";
import { useQuery } from "react-query";
import { getByRegionId, getFileByRegionId } from "../utils/metadata";
import normalizeTimeseries, { TimeseriesRow } from "../utils/normalizeTimeseries";
import useMetadata from "./useMetadata";

export default function useRegionData(regionIds: string[]) {
  const cache = useRef<Record<string, TimeseriesRow[]>>({});
  const { data: metadata } = useMetadata();

  const sortedRegionIds = useMemo(() => sortBy(regionIds), [regionIds]);

  const queryFn = useCallback(
    async (_: string, keys: string[]) => {
      if (!metadata) return {};

      const cachedKeys: string[] = [];
      const uncachedKeys: string[] = [];
      keys.forEach((key) => {
        (!!cache.current[key] ? cachedKeys : uncachedKeys).push(key);
      });

      const keysByFile = groupBy(uncachedKeys, (k: string) => getFileByRegionId(metadata, k));
      const files = Object.keys(keysByFile);

      const dataByKey: Record<string, TimeseriesRow[]> = {};

      const data = await Promise.all(files.map((file) => csv(`https://raw.githubusercontent.com/inf-covid19/covid19-data/master/${file}?v=2`)));
      data.forEach((raw, index) => {
        keysByFile[files[index]].forEach((key) => {
          dataByKey[key] = normalizeTimeseries(key, raw, getByRegionId(metadata, key));
        });
      });

      cachedKeys.forEach((key) => {
        dataByKey[key] = cache.current[key];
      });

      cache.current = dataByKey;

      return dataByKey;
    },
    [metadata]
  );

  const { data, status, error } = useQuery(metadata && ["region-data-v1", sortedRegionIds], queryFn);

  return useMemo(() => ({ data, loading: status === "loading", error }), [data, status, error]);
}

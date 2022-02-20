import sortBy from "lodash/sortBy";
import { useCallback, useMemo, useRef } from "react";
import { useQuery } from "react-query";
import { AUTOCOVS_API } from "../constants";
import { TimeseriesRow } from "../utils/normalizeTimeseries";
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

      const dataByKey: Record<string, TimeseriesRow[]> = {};

      const data = await Promise.all(uncachedKeys.map((id) => fetch(`${AUTOCOVS_API}/location/${id}`).then((r) => r.json())));
      data.forEach((raw, index) => {
        dataByKey[uncachedKeys[index]] = raw.map((x: any) => ({...x, date: new Date(x.date)}));
      });

      cachedKeys.forEach((key) => {
        dataByKey[key] = cache.current[key];
      });

      cache.current = dataByKey;

      return dataByKey;
    },
    [metadata]
  );

  const { data, status, error } = useQuery(metadata && ["region-data", sortedRegionIds], queryFn);

  return useMemo(() => ({ data, loading: status === "loading", error }), [data, status, error]);
}

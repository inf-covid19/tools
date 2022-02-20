import { keyBy } from "lodash";
import { useMemo } from "react";
import { useQuery } from "react-query";
import { AUTOCOVS_API } from "../constants";

export type Location = {
  administrative_area_level: number;
  administrative_area_level_1: string;
  administrative_area_level_2?: string;
  administrative_area_level_3?: string;
  children: Array<Location>;
  id: string;
  iso_alpha_2: string;
  iso_alpha_3: string;
  latitude: number;
  longitude: number;
  population: number;
};

export type Metadata = Record<string, Location>;

const fetchMetadata = async () => {
  const response = await fetch(`${AUTOCOVS_API}/metadata`);
  const data = await response.json();
  const metadata = keyBy(data, 'id');
  return metadata as Metadata;
};

export default function useMetadata() {
  const { data = null, status, error } = useQuery("metadata", fetchMetadata);
  return useMemo(() => ({ data, loading: status === "loading", error }), [data, status, error]);
}

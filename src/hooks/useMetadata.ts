import { useMemo } from "react";
import { useQuery } from "react-query";

export type MetadataRegion = {
  name: string;
  file: string;
  iso: string;
  place_type: string;
  parent?: string;
};

export type MetadataCountry = {
  name: string;
  file: string;
  geoId: string;
  countryTerritoryCode: string;
  parent: string;
  regions: Record<string, MetadataRegion>;
};

export type Metadata = Record<string, MetadataCountry>;

const fetchMetadata = async () => {
  const response = await fetch("https://raw.githubusercontent.com/inf-covid19/covid19-data/master/data/metadata.json");
  const data = await response.json();
  return data as Metadata;
};

export default function useMetadata() {
  const { data = null, status, error } = useQuery("metadata", fetchMetadata);

  return useMemo(() => ({ data, loading: status === "loading", error }), [data, status, error]);
}

import get from "lodash/get";
import { Metadata, MetadataRegion, MetadataCountry } from "../hooks/useMetadata";
import { FlagNameValues } from "semantic-ui-react";

const getRegionPath = (id: string) => {
  const [country, region] = id.split(".regions.");
  if (!!region) {
    return [country, "regions", region];
  }
  return [country];
};

export function getByRegionId(metadata: Metadata, regionId: string) {
  const regionPath = getRegionPath(regionId);
  const [country] = regionPath;

  if (country === regionId) {
    const { regions, ...data } = metadata[country];

    return {
      key: regionId,
      flag: getFlag(data),
      displayName: getNameFromCountry(data),
      file: data.file,
      parent: data.parent,
      name: data.name,
      isCountry: true,
    };
  }

  const data: MetadataRegion = get(metadata, regionPath);
  const countryData = metadata[country];

  return {
    key: regionId,
    country,
    flag: getFlag(countryData),
    displayName: getNameFromRegion(data),
    file: data.file,
    parent: data.parent,
    name: data.name,
    isCountry: false,
    place_type: data.place_type,
  };
}

export function getFileByRegionId(metadata: Metadata, regionId: string) {
  const regionData = getByRegionId(metadata, regionId);
  return regionData.file;
}

function getNameFromRegion(data: Pick<MetadataRegion, "name" | "parent">) {
  if (!!data.parent) {
    return `${data.name.replace(/_/g, " ")}, ${data.parent.replace(/_/g, " ")}`;
  }

  return data.name.replace(/_/g, " ");
}

function getNameFromCountry(data: Pick<MetadataCountry, "name">) {
  return data.name.replace(/_/g, " ");
}

function getFlag(data: Pick<MetadataCountry, "geoId">) {
  return data.geoId.toLowerCase() as FlagNameValues;
}

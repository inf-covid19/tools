import get from "lodash/get";
import { Metadata } from "../hooks/useMetadata";

const getRegionPath = (id: string) => {
  const [country, region] = id.split(".regions.");
  if (!!region) {
    return [country, 'regions', region];
  }
  return [country];
};

export function getByRegionId(metadata: Metadata, regionId: string) {
  return get(metadata, getRegionPath(regionId));
}

export function getFileByRegionId(metadata: Metadata, regionId: string) {
  const regionData = getByRegionId(metadata, regionId);
  return regionData.file;
}

export function getNameByRegionId(metadata: Metadata, regionId: string) {
  const data = getByRegionId(metadata, regionId);
  if (!data) {
    return "";
  }

  if (!!data.parent && !metadata.hasOwnProperty(regionId)) {
    return `${data.name.replace(/_/g, ' ')}, ${data.parent.replace(/_/g, ' ')}`;
  }

  return data.name.replace(/_/g, ' ');
}

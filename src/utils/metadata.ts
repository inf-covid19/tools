import get from "lodash/get";

const getRegionPath = (id: string) => {
  let regionPath = id.split(".");
  if (regionPath.length >= 3) {
    regionPath = [...regionPath.slice(0, 2), regionPath.slice(2).join(".")];
  }

  return regionPath;
};

export function getByRegionId(metadata: any, regionId: string) {
  return get(metadata, getRegionPath(regionId));
}

export function getFileByRegionId(metadata: any, regionId: string) {
  let effectiveRegionPath = getRegionPath(regionId);
  const regionData = getByRegionId(metadata, regionId);
  if (regionData && !!regionData.parent) {
    effectiveRegionPath = [...effectiveRegionPath.slice(0, effectiveRegionPath.length - 1), regionData.parent];
  }
  return get(metadata, [...effectiveRegionPath, "file"]);
}

export function getNameByRegionId(metadata: any, regionId: string) {
  const data = getByRegionId(metadata, regionId);
  if (!data) {
    return "";
  }

  if (!!data.parent) {
    return `${data.name.replace(/_/g, ' ')}, ${data.parent.replace(/_/g, ' ')}`;
  }

  return data.name.replace(/_/g, ' ');
}
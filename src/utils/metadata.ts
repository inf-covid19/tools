import get from "lodash/get";

const getRegionPath = (id: string) => {
  const [country, region] = id.split(".regions.");
  if (!!region) {
    return [country, 'regions', region];
  }
  return [country];
};

export function getByRegionId(metadata: any, regionId: string) {
  return get(metadata, getRegionPath(regionId));
}

export function getFileByRegionId(metadata: any, regionId: string) {
  const regionData = getByRegionId(metadata, regionId);
  return regionData.file;
}

export function getNameByRegionId(metadata: any, regionId: string) {
  const data = getByRegionId(metadata, regionId);
  if (!data) {
    return "";
  }

  if (!!data.parent && !metadata.hasOwnProperty(regionId)) {
    return `${data.name.replace(/_/g, ' ')}, ${data.parent.replace(/_/g, ' ')}`;
  }

  return data.name.replace(/_/g, ' ');
}

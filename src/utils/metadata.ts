import { Metadata, Location } from "../hooks/useMetadata";
import { FlagNameValues } from "semantic-ui-react";

const __CACHE: Record<string, Location> = {};

function findLocationInMetadata(metadata: Metadata, id: string) {
  if (id in __CACHE) {
    return __CACHE[id];
  }
  const data = _findLocationInMetadata(metadata, id);
  if (data) {
    __CACHE[id] = data;
  }
  return data;
}

function _findLocationInMetadata(metadata: Metadata, id: string) {
  if (id in metadata) {
    return metadata[id];
  }

  for (let x of Object.values(metadata)) {
    for (let y of x.children) {
      if (y.id === id) {
        return y;
      }

      for (let z of y.children) {
        if (z.id === id) {
          return z;
        }
      }
    }
  }

  return null;
}

export function getByRegionId(metadata: Metadata, regionId: string) {
  const location = findLocationInMetadata(metadata, regionId);

  if (!location) {
    return {
      key: regionId,
      id: regionId,
      flag: regionId as FlagNameValues,
      displayName: regionId,
      name: regionId,
      isCountry: false,
    };
  }

  if (location?.administrative_area_level === 1) {
    return {
      key: regionId,
      id: location.id,
      flag: getFlag(location),
      displayName: getDisplayNameFromLocation(location),
      name: getNameFromLocation(location),
      isCountry: true,
    };
  }

  return {
    key: regionId,
    id: location.id,
    country: location.administrative_area_level_1,
    flag: getFlag(location),
    displayName: getDisplayNameFromLocation(location),
    name: getNameFromLocation(location),
    isCountry: false,
  };
}

export function getFileByRegionId(metadata: Metadata, regionId: string) {
  const regionData = getByRegionId(metadata, regionId);
  return regionData?.id;
}

export function getNameFromLocation(location: Location) {
  if (location.administrative_area_level === 3) {
    return location.administrative_area_level_3!;
  }

  if (location.administrative_area_level === 2) {
    return location.administrative_area_level_2!;
  }

  return location.administrative_area_level_1;
}

export function getDisplayNameFromLocation(location: Location) {
  if (location.administrative_area_level === 3) {
    return `${location.administrative_area_level_3!}, ${location.administrative_area_level_2!}`;
  }

  if (location.administrative_area_level === 2) {
    return `${location.administrative_area_level_2!}, ${location.administrative_area_level_1}`;
  }

  return location.administrative_area_level_1;
}

function getFlag(data: Location) {
  return data.iso_alpha_2?.toLowerCase() as FlagNameValues;
}

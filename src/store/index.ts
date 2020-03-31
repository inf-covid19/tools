import { differenceInHours } from "date-fns";
import { csv } from "d3";
import { COUNTRIES } from "../countries";

const STORAGE_KEY = "covid19-tools.api.cacheV2";

export const getRegionData = (regionId: string) => {
  return withCache(regionId, () => csv(`https://raw.githubusercontent.com/inf-covid19/covid19-data/master/data/countries/${COUNTRIES[regionId]}?v=2`));
};

function initializeCache() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed;
    }
  } catch {
    return {};
  }
  return {};
}

const cache = initializeCache();

const getKey = (key: string) => `${STORAGE_KEY}.${key}`;

const withCache = <T>(key: string, promiser: () => Promise<T>): Promise<T> => {
  if (cache.hasOwnProperty(key)) {
    if (differenceInHours(new Date(), new Date(cache[key].created_at)) < 2) {
      const cachedData = localStorage.getItem(getKey(key));
      if (cachedData) return Promise.resolve(JSON.parse(cachedData));
    }
  }

  return promiser()
    .then(
      data => {
        cache[key] = { created_at: new Date().toISOString() };
        localStorage.setItem(getKey(key), JSON.stringify(data));
        return data;
      },
      reason => {
        if (localStorage.hasOwnProperty(getKey(key))) {
          const cachedData = localStorage.getItem(getKey(key));
          if (cachedData) return Promise.resolve(JSON.parse(cachedData));
        }
        return Promise.reject(reason);
      }
    )
    .finally(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    });
};
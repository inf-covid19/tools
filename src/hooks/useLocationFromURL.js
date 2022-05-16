import { first } from "lodash";
import { useMemo, useCallback } from "react";
import { generatePath, useHistory, useParams } from "react-router";
import useStorageState from "./useStorageState";

function useLocationFromURL({ path, param = "region" }) {
  const { [param]: locationKey } = useParams();

  const [defaultRegion, setDefaultLocation] = useStorageState("use-location-from-url", null);

  const history = useHistory();

  const location = useMemo(() => {
    if (locationKey) {
      return locationKey;
    }

    if (defaultRegion) {
      return defaultRegion;
    }

    return null;
  }, [defaultRegion, locationKey]);

  const selectedLocations = useMemo(() => {
    return location ? { [location]: true } : {};
  }, [location]);

  const setSelectedLocations = useCallback(
    (locations) => {
      const selectedLocation = first(Object.keys(locations)) || undefined;
      history.push({
        pathname: generatePath(path, {
          [param]: selectedLocation,
        }),
      });
      setDefaultLocation(selectedLocation);
    },
    [history, param, path, setDefaultLocation]
  );

  return [location, selectedLocations, setSelectedLocations];
}

export default useLocationFromURL;

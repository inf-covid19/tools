import React, { useCallback, useMemo } from "react";
import RegionSelector from "../RegionSelector";
import useStorageState from "../../hooks/useStorageState";
import useMetadata from "../../hooks/useMetadata";
import { getByRegionId } from "../../utils/metadata";
import LocationComparisonChart from "./LocationComparisonChart";
import { Dropdown } from "semantic-ui-react";

const comparisonTypeOptions = [
  { key: "by calendar date", text: "by calendar date", value: "by_calendar_date" },
  { key: "since first case", text: "since date of the first case", value: "since_first_case" },
];

function LocationContainer({ currentLocation }) {
  const [compareWith, setCompareWith] = useStorageState("similarityDebugger.compareWith", {});
  const [compareType, setCompareType] = useStorageState("similarityDebugger.compareType", comparisonTypeOptions[0].value);

  const filterFn = useCallback((key) => key !== currentLocation.key, [currentLocation]);
  const { data: metadata } = useMetadata();

  const otherLocations = useMemo(() => {
    if (!metadata) {
      return [];
    }

    return Object.keys(compareWith).map((key) => getByRegionId(metadata, key));
  }, [compareWith, metadata]);

  return (
    <div>
      <h3>Please select other locations to compare with {currentLocation.name}</h3>
      <RegionSelector value={compareWith} onChange={setCompareWith} filter={filterFn} zIndex={10} />

      <h3>
        Comparison <Dropdown inline options={comparisonTypeOptions} value={compareType} onChange={(_, { value }) => setCompareType(value)} />
      </h3>
      <LocationComparisonChart compareType={compareType} currentLocation={currentLocation} otherLocations={otherLocations} />
    </div>
  );
}

export default LocationContainer;

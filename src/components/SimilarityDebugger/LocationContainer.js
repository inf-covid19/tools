import React, { useCallback, useMemo } from 'react'
import RegionSelector from "../RegionSelector";
import useStorageState from '../../hooks/useStorageState';
import useMetadata from "../../hooks/useMetadata";
import { getByRegionId } from '../../utils/metadata';
import LocationComparisonChart from './LocationComparisonChart'

function LocationContainer({ currentLocation }) {
    const [compareWith, setCompareWith] = useStorageState('similarityDebugger.compareWith', {})

    const filterFn = useCallback((key) => key !== currentLocation.key, [currentLocation]);
    const { data: metadata } = useMetadata();

    const otherLocations = useMemo(() => {
        if (!metadata) {
            return []
        }

        return Object.keys(compareWith).map(key => getByRegionId(metadata, key));
    }, [compareWith, metadata])

    return (
        <div>
            <h3>Please select other locations to compare with {currentLocation.name}</h3>
            <RegionSelector value={compareWith} onChange={setCompareWith} filter={filterFn} zIndex={10} />

            <h3>Comparison</h3>
            <LocationComparisonChart currentLocation={currentLocation} otherLocations={otherLocations} />
        </div>
    )
}

export default LocationContainer
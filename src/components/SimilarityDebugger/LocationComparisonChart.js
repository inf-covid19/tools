import React, { useMemo } from 'react'
import styled from 'styled-components';
import { Loader } from "semantic-ui-react";
import { useQuery } from "react-query";
import { AUTOCOVS_API as API_URL } from "../../constants";
import { get, keyBy } from 'lodash';

import ChartContainer from './ChartContainer';

const apiGet = async (url, searchParams = {}) => {
    const qs = new URLSearchParams();

    Object.entries(searchParams).forEach(([key, value]) => {
        qs.append(key, typeof value === "object" ? JSON.stringify(value) : value);
    });

    const effectiveUrl = `${API_URL}${url}?${qs.toString()}`;

    const response = await fetch(effectiveUrl);
    if (!response.ok) {
        throw new Error("Network response was not ok");
    }
    return response.json();
};


const columns = [
    'deaths',
    'deaths_daily',
    'deaths_daily_7d',
    'deaths_daily_14d',
    'deaths_daily_21d',
    'confirmed',
    'confirmed_daily',
    'confirmed_daily_7d',
    'confirmed_daily_14d',
    'confirmed_daily_21d',
]

async function fetchFn(currentLocation, otherLocations) {
    const [currentLocationRecords, ...otherLocationRecords] = await Promise.all([
        apiGet(`/records/${currentLocation.id}`),
        ...otherLocations.map(({ id }) => apiGet(`/records/${id}`).then(data => keyBy(data, 'date')))
    ]);

    return Object.fromEntries(otherLocations.map(({ id: locationId }, index) => {

        const locationRecordsByDate = otherLocationRecords[index];



        const data = currentLocationRecords.map((record) => {
            const locationRecord = locationRecordsByDate[record.date];
            const output = { date: record.date }

            columns.forEach(col => {
                output[col] = Math.abs(get(record, col, 0) - get(locationRecord, col, 0))
            })

            return output
        })



        return [locationId, data];
    }))
}

function LocationComparisonChart({ currentLocation, otherLocations }) {
    const { data, status } = useQuery(['location-comparison-data', { currentLocation, otherLocations }], () => fetchFn(currentLocation, otherLocations))


    const locationById = useMemo(() => keyBy(otherLocations.concat([currentLocation]), 'id'), [currentLocation, otherLocations])


    if (status === "loading") {
        return (
            <LoaderWrapper>
                <Loader active inline />
            </LoaderWrapper>
        );
    }

    return (
        <div>
            <ChartContainer attribute="deaths_daily_7d" locationById={locationById} dataByLocationId={data} />
            <ChartContainer attribute="confirmed_daily_7d" locationById={locationById} dataByLocationId={data} reversed />

        </div>
    )
}

export default LocationComparisonChart

const LoaderWrapper = styled.div`
  height: 350px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

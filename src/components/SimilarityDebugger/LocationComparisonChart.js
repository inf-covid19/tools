import React, { useMemo } from "react";
import styled from "styled-components";
import { Loader } from "semantic-ui-react";
import { useQuery } from "react-query";
import { AUTOCOVS_API as API_URL } from "../../constants";
import { get, keyBy } from "lodash";

import ChartContainer from "./ChartContainer";

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
  "deaths",
  "deaths_by_100k",
  "deaths_daily",
  "deaths_by_100k_daily",
  "deaths_daily_7d",
  "deaths_by_100k_daily_7d",
  "deaths_daily_14d",
  "deaths_by_100k_daily_14d",
  "deaths_daily_21d",
  "deaths_by_100k_daily_21d",
  "confirmed",
  "confirmed_by_100k",
  "confirmed_daily",
  "confirmed_by_100k_daily",
  "confirmed_daily_7d",
  "confirmed_by_100k_daily_7d",
  "confirmed_daily_14d",
  "confirmed_by_100k_daily_14d",
  "confirmed_daily_21d",
  "confirmed_by_100k_daily_21d",
];

async function getByDate(currentLocation, otherLocations) {
  const [currentLocationRecords, ...otherLocationRecords] = await Promise.all([
    apiGet(`/records/${currentLocation.id}`),
    ...otherLocations.map(({ id }) => apiGet(`/records/${id}`).then((data) => keyBy(data, "date"))),
  ]);

  return Object.fromEntries(
    [
      [
        currentLocation.id,
        currentLocationRecords.map((record) => {
          const output = { date: record.date, source: record };

          columns.forEach((col) => {
            output[col] = 0;
          });

          return output;
        }),
      ],
    ].concat(
      otherLocations.map(({ id: locationId }, index) => {
        const locationRecordsByDate = otherLocationRecords[index];

        const data = currentLocationRecords.map((record) => {
          const locationRecord = locationRecordsByDate[record.date];
          const output = { date: record.date, source: locationRecord };

          columns.forEach((col) => {
            output[col] = get(locationRecord, col, 0) - get(record, col, 0);
          });

          return output;
        });

        return [locationId, data];
      })
    )
  );
}

async function getByFirstCase(currentLocation, otherLocations) {
  const [currentLocationRecords, ...otherLocationRecords] = await Promise.all([
    apiGet(`/records/${currentLocation.id}`),
    ...otherLocations.map(({ id }) => apiGet(`/records/${id}`)),
  ]);

  return Object.fromEntries(
    [
      [
        currentLocation.id,
        currentLocationRecords.map((record, index) => {
          const output = { date: record.date, index, source: record };

          columns.forEach((col) => {
            output[col] = 0;
          });

          return output;
        }),
      ],
    ].concat(
      otherLocations.map(({ id: locationId }, index) => {
        const locationRecordsByIndex = otherLocationRecords[index];

        const data = currentLocationRecords.map((record, recordIndex) => {
          const locationRecord = locationRecordsByIndex[recordIndex];
          const output = { date: record.date, index: recordIndex, source: locationRecord };

          columns.forEach((col) => {
            output[col] = get(locationRecord, col, 0) - get(record, col, 0);
          });

          return output;
        });

        return [locationId, data];
      })
    )
  );
}

function LocationComparisonChart({ compareType, currentLocation, otherLocations }) {
  const { data, status } = useQuery(["location-comparison-data", { currentLocation, otherLocations, compareType }], () => {
    if (compareType === "since_first_case") {
      return getByFirstCase(currentLocation, otherLocations);
    }
    return getByDate(currentLocation, otherLocations);
  });

  const locationById = useMemo(() => keyBy(otherLocations.concat([currentLocation]), "id"), [currentLocation, otherLocations]);

  if (status === "loading") {
    return (
      <LoaderWrapper>
        <Loader active inline />
      </LoaderWrapper>
    );
  }

  return (
    <div>
      <h4>Deaths | 7-day moving average</h4>
      <ChartContainer
        currentLocation={currentLocation}
        attribute="deaths_daily_7d"
        byAttribute={compareType === "since_first_case" ? "index" : "date"}
        locationById={locationById}
        dataByLocationId={data}
      />
      <h4>Deaths | 7-day moving average per 100k inhab.</h4>
      <ChartContainer
        currentLocation={currentLocation}
        attribute="deaths_by_100k_daily_7d"
        byAttribute={compareType === "since_first_case" ? "index" : "date"}
        locationById={locationById}
        dataByLocationId={data}
      />

      <h4>Confirmed | 7-day moving average</h4>
      <ChartContainer
        currentLocation={currentLocation}
        attribute="confirmed_daily_7d"
        byAttribute={compareType === "since_first_case" ? "index" : "date"}
        locationById={locationById}
        dataByLocationId={data}
      />
      <h4>Confirmed | 7-day moving average per 100k inhab.</h4>
      <ChartContainer
        currentLocation={currentLocation}
        attribute="confirmed_by_100k_daily_7d"
        byAttribute={compareType === "since_first_case" ? "index" : "date"}
        locationById={locationById}
        dataByLocationId={data}
      />
    </div>
  );
}

export default LocationComparisonChart;

const LoaderWrapper = styled.div`
  height: 350px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

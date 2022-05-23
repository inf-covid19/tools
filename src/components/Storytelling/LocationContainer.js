import { sortBy } from "lodash";
import React from "react";
import { useQuery } from "react-query";
import { Loader } from "semantic-ui-react";
import styled from "styled-components";
import Legend from "./Legend";
import LocationChart from "./LocationChart";
import LocationRestrictions from "./LocationRestrictions";
import LocationStory from "./LocationStory";
import { makeGet } from "./utils/api";
import { MeasuresConfig } from "./utils/constants";

const defaultPolicies = ["stay_home_restrictions", "workplace_closing", "school_closing"];

async function fetchLocationDataset(locationId) {
  const featuredPeriodConfig = {
    method: "otsu",
    smooth_fn: "savgol_filter",
    smooth_params: { polyorder: 2, window_length: 7 },
  };

  const [records, featuredConfirmedPeriods, featuredDeathsPeriods, covidVariants] = await Promise.all([
    makeGet(`/records/${locationId}`),
    makeGet(`/featured_periods/${locationId}`, { ...featuredPeriodConfig, target_column: "confirmed_daily_21d" }),
    makeGet(`/featured_periods/${locationId}`, { ...featuredPeriodConfig, target_column: "deaths_daily_21d" }),
    makeGet(`/covid_variants`),
  ]);

  return { records, featuredConfirmedPeriods, featuredDeathsPeriods, covidVariants };
}

function LocationContainer({ location }) {
  const { data, status } = useQuery(["location-dataset", location.id], () => fetchLocationDataset(location.id));

  if (status === "loading") {
    return (
      <LoaderWrapper>
        <Loader active inline />
      </LoaderWrapper>
    );
  }

  return (
    <div>
      <LocationChart key={`${location.id}:deaths`} location={location} attribute="deaths" {...data} />
      <LocationRestrictions key={`${location.id}:restrictions`} location={location} policies={defaultPolicies} {...data} />
      <LocationChart key={`${location.id}:confirmed`} location={location} attribute="confirmed" {...data} />
      <Legend
        legends={defaultPolicies.map((x) => {
          const config = MeasuresConfig[x];
          return {
            ...config,
            possibleValues: sortBy(Object.keys(config.indicators)),
          };
        })}
      />
      <LocationStory location={location} {...data} />
    </div>
  );
}

export default LocationContainer;

const LoaderWrapper = styled.div`
  height: 350px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

import React from "react";
import { useQuery } from "react-query";
import { Loader } from "semantic-ui-react";
import styled from "styled-components";
import { AUTOCOVS_API as API_URL } from "../../constants";
import LocationChart from "./LocationChart";


const get = async (url, searchParams = {}) => {
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

async function fetchLocationDataset(locationId) {
  const featuredPeriodConfig = {
    method: "otsu",
    smooth_fn: "savgol_filter",
    smooth_params: { polyorder: 1, window_length: 7, closed: "right", alpha: 0.075 },
  };

  const [records, featuredConfirmedPeriods, featuredDeathsPeriods, covidVariants] = await Promise.all([
    get(`/records/${locationId}`),
    get(`/featured_periods/${locationId}`, { ...featuredPeriodConfig, target_column: "confirmed_daily" }),
    get(`/featured_periods/${locationId}`, { ...featuredPeriodConfig, target_column: "deaths_daily" }),
    get(`/covid_variants`),
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
      <LocationChart location={location} {...data} />
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
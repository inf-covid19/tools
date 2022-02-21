import * as d3 from "d3";
import React, { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import { Loader } from "semantic-ui-react";
import styled from "styled-components/macro";
import useMetadata from "../../../hooks/useMetadata";
import useRegionData from "../../../hooks/useRegionData";
import ChartWrapper from "../ChartWrapper";
import { DateRange, filterByDateRange } from "./utils";

const displayNumberFormatter = d3.format(",.2~f");

function PeopleVaccinatedChart({ regionId, dateRange }: { regionId: string; dateRange?: DateRange }) {
  const { data } = useRegionData([regionId]);
  const { data: metadata } = useMetadata();

  const series = useMemo(() => {
    if (!data || !metadata) return null;

    const timeseries = filterByDateRange(data[regionId], dateRange);

    const hasVaccines = timeseries.some((x) => x.people_vaccinated && x.people_vaccinated > 0 && x.people_fully_vaccinated && x.people_fully_vaccinated > 0);

    if (!hasVaccines) {
      return [];
    }

    return [
      {
        name: "Fully vaccinated",
        data: timeseries.map((row) => ({
          x: row.date,
          y: row.people_vaccinated || 0,
        })),
      },
      {
        name: "Partial vaccinated",
        data: timeseries.map((row) => ({
          x: row.date,
          y: row.people_fully_vaccinated || 0,
        })),
      },
    ];
  }, [data, dateRange, metadata, regionId]);

  const options = useMemo(() => {
    return {
      stroke: {
        curve: "smooth",
        width: 2,
      },
      chart: {
        fontFamily: "Lato, 'Helvetica Neue', Arial, Helvetica, sans-serif",
        animations: {
          enabled: false,
          animateGradually: { enabled: false },
        },
        toolbar: {
          tools: {
            download: false,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false,
          },
        },
      },
      xaxis: {
        type: "datetime",
      },
      yaxis: [
        {
          axisTicks: {
            offsetX: 5,
          },
          axisBorder: {
            offsetX: 5,
          },
          labels: {
            offsetX: 5,
            formatter: displayNumberFormatter,
          },
          title: {
            offsetX: 5,
            text: "Number of People",
          },
        },
      ],
      dataLabels: {
        enabled: false,
      },
      fill: {
        type: "gradient",
        gradient: {
          inverseColors: false,
          shade: "light",
          type: "vertical",
          opacityFrom: 0.85,
          opacityTo: 0.55,
          stops: [0, 100, 100, 100],
        },
      },
    };
  }, []);

  if (series?.length === 0) {
    return null;
  }

  return (
    <ChartWrapper
      title="People Vaccinated"
      subtitle="Show the breakdown of people vaccinated, between those who have received only their first vaccine dose, and those who have completed the initial vaccination protocol (2 doses for most vaccines, 1 or 3 for a few manufacturers)."
    >
      {series ? (
        <ReactApexChart series={series} type="area" height="300" options={options} />
      ) : (
        <LoaderWrapper>
          <Loader active inline />
        </LoaderWrapper>
      )}
    </ChartWrapper>
  );
}

export default PeopleVaccinatedChart;

const LoaderWrapper = styled.div`
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

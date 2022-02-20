import * as d3 from "d3";
import React, { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import { Loader } from "semantic-ui-react";
import styled from "styled-components/macro";
import useMetadata from "../../../hooks/useMetadata";
import useRegionData from "../../../hooks/useRegionData";
import ChartWrapper from "../ChartWrapper";
import { average } from "../../../utils/math";
import { DateRange, filterByDateRange } from "./utils";

const displayNumberFormatter = d3.format(",.2~f");

function DeathsChart({ regionId, dateRange }: { regionId: string, dateRange?: DateRange }) {
  const { data } = useRegionData([regionId]);
  const { data: metadata } = useMetadata();

  const series = useMemo(() => {
    if (!data || !metadata) return null;

    const timeseries =filterByDateRange(data[regionId], dateRange).filter((row) => row.deaths > 0);

    return [
      {
        name: "Total Confirmed Deaths",
        data: timeseries.map((row) => ({
          x: row.date,
          y: row.deaths,
        })),
      },
      {
        type: "bar",
        name: "Daily Confirmed Deaths",
        data: timeseries.map((row) => ({
          x: row.date,
          y: row.deaths_daily,
        })),
      },
      {
        type: "area",
        name: "7-day Avg. Confirmed Deaths",
        data: timeseries.map((row, index) => {
          const dailyValues = timeseries.slice(Math.max(0, index - 6), index + 1).map((r) => r.deaths_daily);

          return {
            x: row.date,
            y: Math.round(average(dailyValues)),
          };
        }),
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
            text: "Total Confirmed Deaths",
          },
        },
        {
          opposite: true,
          axisTicks: {
            offsetX: -5,
          },
          axisBorder: {
            offsetX: -5,
          },
          labels: {
            offsetX: -5,
            formatter: displayNumberFormatter,
          },
          title: {
            offsetX: -5,
            text: "Daily Confirmed Deaths",
          },
        },
        {
          seriesName: "Daily Confirmed Deaths",
          show: false,
          labels: {
            formatter: displayNumberFormatter,
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

  return (
    <ChartWrapper
      title="Confirmed Deaths"
      subtitle="Limited testing and challenges in the attribution of the cause of death means that the number of confirmed deaths may not be an accurate count of the true number of deaths from COVID-19."
    >
      {series ? (
        <ReactApexChart series={series} type="line" height="300" options={options} />
      ) : (
        <LoaderWrapper>
          <Loader active inline />
        </LoaderWrapper>
      )}
    </ChartWrapper>
  );
}

export default DeathsChart;

const LoaderWrapper = styled.div`
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

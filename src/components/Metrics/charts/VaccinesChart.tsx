import * as d3 from "d3";
import React, { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import { Loader } from "semantic-ui-react";
import styled from "styled-components/macro";
import useMetadata from "../../../hooks/useMetadata";
import useRegionData from "../../../hooks/useRegionData";
import { average } from "../../../utils/math";
import ChartWrapper from "../ChartWrapper";
import { DateRange, filterByDateRange } from "./utils";

const displayNumberFormatter = d3.format(",.2~f");

function VaccinesChart({ regionId, dateRange }: { regionId: string; dateRange?: DateRange }) {
  const { data } = useRegionData([regionId]);
  const { data: metadata } = useMetadata();

  const series = useMemo(() => {
    if (!data || !metadata) return null;

    const timeseries = filterByDateRange(data[regionId], dateRange);

    const hasVaccines = timeseries.some((x) => x.vaccines && x.vaccines > 0);

    if (!hasVaccines) {
      return [];
    }

    return [
      {
        name: "Total Administered Doses",
        data: timeseries.map((row) => ({
          x: row.date,
          y: row.vaccines || 0,
        })),
      },
      {
        type: "bar",
        name: "Daily Administered Doses",
        data: timeseries.map((row) => ({
          x: row.date,
          y: row.vaccines_daily || 0,
        })),
      },
      {
        type: "area",
        name: "7-day Avg. Doses Administered",
        data: timeseries.map((row, index) => {
          const dailyValues = timeseries.slice(Math.max(0, index - 6), index + 1).map((r) => r.vaccines_daily || 0);

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
            text: "Total Administered Doses",
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
            text: "Daily Administered Doses",
          },
        },
        {
          seriesName: "Daily Administered Doses",
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

  if (series?.length === 0) {
    return null;
  }

  return (
    <ChartWrapper
      title="Vaccine Doses"
      subtitle="Show the number of vaccine doses administered within a given population. All doses, including boosters, are counted individually."
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

export default VaccinesChart;

const LoaderWrapper = styled.div`
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

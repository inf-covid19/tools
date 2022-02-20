import * as d3 from "d3";
import React, { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import { Loader } from "semantic-ui-react";
import styled from "styled-components/macro";
import useMetadata from "../../../hooks/useMetadata";
import useRegionData from "../../../hooks/useRegionData";
import { average } from "../../../utils/math";
import ChartWrapper from "../ChartWrapper";

const displayNumberFormatter = d3.format(",.2~f");

function CasesChart({ regionId }: { regionId: string }) {
  const { data } = useRegionData([regionId]);
  const { data: metadata } = useMetadata();

  const series = useMemo(() => {
    if (!data || !metadata) return null;

    const timeseries = data[regionId].filter((row) => row.confirmed > 0);

    return [
      {
        name: "Total Confirmed Cases",
        data: timeseries.map((row) => ({
          x: row.date,
          y: row.confirmed,
        })),
      },
      {
        type: "bar",
        name: "Daily Confirmed Cases",
        data: timeseries.map((row) => ({
          x: row.date,
          y: row.confirmed_daily,
        })),
      },
      {
        type: "area",
        name: "7-day Avg. Confirmed Cases",
        data: timeseries.map((row, index) => {
          const dailyValues = timeseries.slice(Math.max(0, index - 6), index + 1).map((r) => r.confirmed_daily);

          return {
            x: row.date,
            y: Math.round(average(dailyValues)),
          };
        }),
      },
    ];
  }, [data, metadata, regionId]);

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
            text: "Total Confirmed Cases",
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
            text: "Daily Confirmed Cases",
          },
        },
        {
          seriesName: "Daily Confirmed Cases",
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
          shade: 'light',
          type: "vertical",
          opacityFrom: 0.85,
          opacityTo: 0.55,
          stops: [0, 100, 100, 100]
        }
      }
    };
  }, []);

  return (
    <ChartWrapper title="Confirmed Cases" subtitle="The number of confirmed cases is lower than the number of total cases. The main reason for this is limited testing.">
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

export default CasesChart;

const LoaderWrapper = styled.div`
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

import * as d3 from "d3";
import React, { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import { Loader } from "semantic-ui-react";
import styled from "styled-components/macro";
import useMetadata from "../../../hooks/useMetadata";
import useRegionData from "../../../hooks/useRegionData";
import ChartWrapper from "../ChartWrapper";

const displayNumberFormatter = d3.format(",.2~f");

function CasesChart({ regionId }: { regionId: string }) {
  const { data } = useRegionData([regionId]);
  const { data: metadata } = useMetadata();

  const series = useMemo(() => {
    if (!data || !metadata) return null;

    const timeseries = data[regionId];

    return [
      {
        name: "Total Confirmed Cases",
        data: timeseries.map((row) => ({
          x: row.date,
          y: row.cases,
        })),
      },
      {
        type: "bar",
        name: "Daily Confirmed Cases",
        data: timeseries.map((row) => ({
          x: row.date,
          y: row.cases_daily,
        })),
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
      ],
      dataLabels: {
        enabled: false,
      },
    };
  }, []);

  return (
    <ChartWrapper
      title="Confirmed Cases"
      subtitle="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas suscipit aliquam lectus eu auctor. Fusce pharetra leo et interdum bibendum."
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

export default CasesChart;

const LoaderWrapper = styled.div`
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

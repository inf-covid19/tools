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

function CaseFatalityChart({ regionId, dateRange }: { regionId: string, dateRange?: DateRange }) {
  const { data } = useRegionData([regionId]);
  const { data: metadata } = useMetadata();

  const series = useMemo(() => {
    if (!data || !metadata) return null;

    const timeseries = filterByDateRange(data[regionId], dateRange).filter((row) => row.deaths > 0);

    return [
      {
        name: "Case Fatality Rate",
        data: timeseries.map((row) => ({
          x: row.date,
          y: (row.deaths / row.confirmed) * 100,
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
            formatter: (n: number) => `${displayNumberFormatter(n)}%`,
          },
          title: {
            offsetX: 5,
            text: "Case Fatality Rate",
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
      title="Case Fatality Rate"
      subtitle="The Case Fatality Rate (CFR) is the ratio between confirmed deaths and confirmed cases. During an outbreak of a pandemic the CFR is a poor measure of the mortality risk of the disease."
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

export default CaseFatalityChart;

const LoaderWrapper = styled.div`
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

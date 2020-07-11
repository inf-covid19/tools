import * as d3 from "d3";
import React, { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import { Loader } from "semantic-ui-react";
import styled from "styled-components/macro";
import useMetadata from "../../../hooks/useMetadata";
import useRegionData from "../../../hooks/useRegionData";
import ChartWrapper from "../ChartWrapper";

const METHOD = 6;
const displayNumberFormatter = d3.format(",.2~f");

function ReproductionChart({ regionId }: { regionId: string }) {
  const { data } = useRegionData([regionId]);
  const { data: metadata } = useMetadata();

  const series = useMemo(() => {
    if (!data || !metadata) return null;

    const timeseries = data[regionId].filter((row) => row.cases > 50);

    const seriesData = [];

    for (let i = 11; i < timeseries.length; i++) {
      let generation1 = 0;
      let generation2 = 0;
      for (let j = 0; j < METHOD; j++) {
        if (i - j >= 0) {
          generation1 += timeseries[i - j].cases_daily;
        }
        if (i - j - 4 >= 0) {
          generation2 += timeseries[i - j - 4].cases_daily;
        }
      }
      seriesData.push({ x: timeseries[i].date.getTime(), y: generation2 === 0 ? 0 : generation1 / generation2 });
    }

    return [
      {
        name: "Reproduction Number",
        data: seriesData,
      },
    ];
  }, [data, metadata, regionId]);

  const options = useMemo(() => {
    return {
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
      yaxis: {
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
          text: "Reproduction Number",
        },
      },
      dataLabels: {
        enabled: false,
      },
      plotOptions: {
        bar: {
          colors: {
            ranges: [
              {
                from: 0,
                to: 1,
                color: "#00429d",
              },
              {
                from: 1,
                to: Number.POSITIVE_INFINITY,
                color: "#93003a",
              },
            ],
          },
        },
      },
      // fill:{
      //   colors: [function({value} : any) {
      //     if (value < 1) {
      //       return '#00429d'
      //     }
      //     return '#93003a'
      //   }]
      // }
    };
  }, []);

  return (
    <ChartWrapper
      title="Basic Reproduction Number"
      subtitle={
        <>
          The Basic Reproduction Number denoted, of an infection can be thought of as the expected number of cases directly generated by one case in a population where all
          individuals are susceptible to infection.{" "}
          <a href="https://doi.org/10.1093/aje/kwt133" rel="noopener noreferrer" target="_blank">
            Learn more
          </a>
          .
        </>
      }
    >
      {series ? (
        <ReactApexChart series={series} type="bar" height="300" options={options} />
      ) : (
        <LoaderWrapper>
          <Loader active inline />
        </LoaderWrapper>
      )}
    </ChartWrapper>
  );
}

export default ReproductionChart;

const LoaderWrapper = styled.div`
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

import * as d3 from "d3";
import { startOfDay, subDays } from "date-fns";
import get from "lodash/get";
import sortBy from "lodash/sortBy";
import numeral from "numeral";
import React, { useMemo } from "react";
import ReactApexChart, { Props } from "react-apexcharts";
import { Loader } from "semantic-ui-react";
import useMetadata from "../hooks/useMetadata";
import useRegionData from "../hooks/useRegionData";
import useSeriesColors from "../hooks/useSeriesColors";
import { getNameByRegionId } from "../utils/metadata";
import { alignTimeseries, TimeseriesRow } from "../utils/normalizeTimeseries";
import { ChartOptions } from "./Editor";
import useColorScale from "../hooks/useColorScale";
import { isNumber } from "lodash";

const displayNumberFormatter = d3.format(",.2~f");
const ordinalFormattter = (n: number) => numeral(n).format("Oo");
const numberFormatter = d3.format(".2~s");

type CustomizableChartProps = Omit<Props, "options" | "series" | "type"> &
  ChartOptions & {
    isIncidence?: boolean;
    getPopulation?: (key: string) => number;
  };

function CustomizableChart(props: CustomizableChartProps, ref: React.Ref<any>) {
  const {
    chartType = "heatmap",
    title,
    metric,
    showDataLabels,
    isCumulative,
    dayInterval,
    selectedRegions,
    alignAt = 0,
    timeserieSlice,
    isIncidence,
    getPopulation,
    ...rest
  } = props;

  const regionsIds = useMemo(() => Object.keys(selectedRegions), [selectedRegions]);

  const { data, loading, error } = useRegionData(regionsIds);
  const { data: metadata } = useMetadata();

  const series = useMemo(() => {
    if (loading || !data || !metadata) {
      return [];
    }

    const earliestDate = subDays(startOfDay(new Date()), dayInterval);
    return Object.entries(data).flatMap(([region, regionData]) => {
      const name = getNameByRegionId(metadata, region);

      const getValue = (row: TimeseriesRow) => {
        const value = isCumulative ? (metric === "cases" ? row.cases : row.deaths) : metric === "cases" ? row.cases_daily : row.deaths_daily;

        if (isIncidence && getPopulation) {
          const population = getPopulation(region);

          return (value / population) * 100000;
        }

        return value;
      };

      if (alignAt > 0) {
        const alignedData = regionData.filter((v) => v[metric] >= alignAt);

        if (alignedData.length === 0) {
          return [];
        }

        return [
          {
            name,
            key: region,
            data: alignedData.map((row, index) => ({
              x: index + 1,
              y: getValue(row),
            })),
          },
        ];
      }

      return [
        {
          name,
          key: region,
          data: alignTimeseries(regionData, earliestDate).map((row) => ({
            x: row.date.getTime(),
            y: getValue(row),
          })),
        },
      ];
    });
  }, [loading, data, metadata, dayInterval, alignAt, isCumulative, metric, isIncidence, getPopulation]);

  const sortedSeries = useMemo(() => {
    return sortBy(
      series.map((s) => ({
        ...s,
        data: s.data.slice(0, timeserieSlice),
      })),
      chartType === "heatmap" ? (s) => get(s.data, [s.data.length - 1, "y"], 0) : "name"
    );
  }, [series, chartType, timeserieSlice]);

  const seriesColors = useSeriesColors(sortedSeries);
  const colorScale = useColorScale(sortedSeries);

  const chartOptions = useMemo(() => {
    return {
      chart: {
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
      colors: seriesColors,
      tooltip: {
        y: {
          formatter: (value: number) => `${displayNumberFormatter(value)} ${metric}${isIncidence ? " per 100k people" : ""}`,
        },
        x: {
          formatter: alignAt > 0 ? (value: number) => `${ordinalFormattter(value)} day after ${numberFormatter(alignAt)} ${metric}` : undefined,
        },
      },
      xaxis: {
        type: alignAt === 0 ? "datetime" : "numeric",
        labels: {
          formatter: alignAt > 0 ? ordinalFormattter : undefined,
        },
      },
      yaxis: {
        labels: {
          formatter: (value: any) => isNumber(value) ? numberFormatter(value) : value,
        },
      },
      dataLabels: {
        enabled: showDataLabels,
        formatter: numberFormatter,
      },
      title: {
        text: title,
        style: {
          fontSize: "20px",
          fontFamily: "Lato, 'Helvetica Neue', Arial, Helvetica, sans-serif",
        },
      },
      subtitle: {
        text: `${isCumulative ? "Total" : "Daily"} number of ${metric}${isIncidence ? " per 100k people" : ""}`,
        floating: true,
        style: {
          fontSize: "14px",
          fontFamily: "Lato, 'Helvetica Neue', Arial, Helvetica, sans-serif",
        },
      },
      plotOptions: {
        heatmap: {
          colorScale,
        },
      },
    };
  }, [seriesColors, alignAt, showDataLabels, title, isCumulative, metric, isIncidence, colorScale]);

  if (loading) {
    return (
      <div style={{ height: props.height, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Loader active inline />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: props.height, display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        Ooops! Something is wrong.
        <br />
        Please try it later or choose different regions.
      </div>
    );
  }

  return <ReactApexChart key={chartType} ref={ref} options={chartOptions} series={sortedSeries} type={chartType} height={rest.height} width={rest.width} />;
}

export default React.forwardRef(CustomizableChart);

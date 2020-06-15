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
import { getByRegionId } from "../utils/metadata";
import { alignTimeseries, TimeseriesRow } from "../utils/normalizeTimeseries";
import { ChartOptions } from "./Editor";
import useColorScale from "../hooks/useColorScale";
import { isNumber } from "lodash";
import { titleCase } from "../utils/string";

const displayNumberFormatter = d3.format(",.2~f");
const increaseNumberFormatter = d3.format("+.1~f");
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
      const { displayName } = getByRegionId(metadata, region);

      const getValue = (row: TimeseriesRow) => {
        const value = isCumulative ? (metric === "cases" ? row.cases : row.deaths) : metric === "cases" ? row.cases_daily : row.deaths_daily;

        if (isIncidence && getPopulation) {
          const population = getPopulation(region);

          return (value / population) * 100000;
        }

        return value;
      };

      if (alignAt > 0) {
        const alignedIndex = regionData.findIndex((v) => v[metric] >= alignAt);
        const alignedData = regionData.slice(alignedIndex);

        if (alignedData.length === 0) {
          return [];
        }

        return [
          {
            name: displayName,
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
          name: displayName,
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
        data: timeserieSlice > 0 ? s.data.slice(0, timeserieSlice) : s.data,
      })),
      chartType === "heatmap" ? (s) => get(s.data, [s.data.length - 1, "y"], 0) : "name"
    );
  }, [series, chartType, timeserieSlice]);

  const seriesColors = useSeriesColors(sortedSeries);
  const colorScale = useColorScale(sortedSeries);

  const chartOptions = useMemo(() => {
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
      colors: seriesColors,
      tooltip: {
        y: {
          formatter: (value: number, point: any) => {
            const prevValue = point?.w?.config?.series[point.seriesIndex]?.data[point.dataPointIndex - 1]?.y ?? value;
            return `${displayNumberFormatter(value)} ${metric}${isIncidence ? " per 100k inhab." : ""} (${increaseNumberFormatter((value - prevValue) / prevValue * 100)}%)`
          },
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
        axisTicks: {
          offsetX: 5,
        },
        axisBorder: {
          offsetX: 5,
        },
        labels: {
          offsetX: 5,
          formatter: (value: number | string) => (isNumber(value) ? (value < 1 ? displayNumberFormatter(value) : numberFormatter(value)) : value),
        },
        title: {
          offsetX: 5,
          text:
            chartType === "heatmap"
              ? undefined
              : `${isCumulative ? "Total" : "Daily"} Confirmed ${titleCase(metric)}${isIncidence ? " (per 100k inhab.)" : ""}`,
        },
      },
      dataLabels: {
        enabled: showDataLabels,
        formatter: numberFormatter,
      },
      title: {
        text: title,
        style: {
          fontSize: "18px",
        },
      },
      plotOptions: {
        heatmap: {
          colorScale,
        },
      },
    };
  }, [seriesColors, alignAt, chartType, isCumulative, metric, isIncidence, showDataLabels, title, colorScale]);

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

  return (
    <ReactApexChart
      key={chartType}
      ref={ref}
      options={chartOptions}
      series={sortedSeries}
      type={chartType}
      height={Math.max(Number(rest.height), (chartType === "heatmap" ? 30 : 0) * sortedSeries.length)}
      width={rest.width}
    />
  );
}

export default React.forwardRef(CustomizableChart);

import * as d3 from "d3";
import { format } from "date-fns";
import { first, last } from "lodash";
import get from "lodash/get";
import React, { useMemo } from "react";
import ReactApexChart, { Props } from "react-apexcharts";
import { Loader } from "semantic-ui-react";
import useRegionData from "../hooks/useRegionData";
import useSeriesColors from "../hooks/useSeriesColors";
import { ChartOptions } from "./Editor";
import { getNameByRegionId } from "../utils/metadata";
import useMetadata from "../hooks/useMetadata";

const numberFormatter = d3.format(".2s");

const displayNumberFormatter = d3.format(",");

const titleCase = (word: string) => word.slice(0, 1).toUpperCase() + word.slice(1);

type TrendChartProps = Omit<Props, "options" | "series" | "type"> & Pick<ChartOptions, "selectedRegions" | "title" | "alignAt" | "metric" | "scale">;

function TrendChart(props: TrendChartProps, ref: React.Ref<any>) {
  const { selectedRegions, title, alignAt, metric, scale = "log", ...rest } = props;

  const regionsIds = useMemo(() => {
    return Object.keys(selectedRegions);
  }, [selectedRegions]);

  const { data, loading } = useRegionData(regionsIds);
  const { data: metadata } = useMetadata();

  const series = useMemo(() => {
    if (!data) return [];

    const series = Object.entries(data).map(([regionId, regionData]) => {
      return {
        key: regionId,
        name: getNameByRegionId(metadata, regionId),
        data: regionData.flatMap((row, index) => {
          const valueColumn = metric;
          const valueDailyColumn = `${metric}_daily`;

          if (row.cases < alignAt) return [];

          return [
            {
              date: row.date,
              x: row[valueColumn],
              y: regionData.slice(Math.max(0, index - 7), index).reduce((sum, r) => sum + get(r, valueDailyColumn, 0), 0),
            },
          ];
        }),
      };
    });

    return series;
  }, [data, metadata, metric, alignAt]);

  const filteredSeries = useMemo(() => {
    return series.filter(({ key }) => !!selectedRegions[key]);
  }, [series, selectedRegions]);

  const [xScaler, yScaler, scaledSeries] = useMemo(() => {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    filteredSeries.forEach(({ data }) => {
      data.forEach(({ x, y }) => {
        minX = Math.min(x, minX);
        maxX = Math.max(x, maxX);
        minY = Math.min(y, minY);
        maxY = Math.max(y, maxY);
      });
    });

    const xScaler =
      scale === "log"
        ? d3.scaleLog().domain([Math.max(0.01, Math.pow(10, Math.floor(Math.log10(minX)))), Math.pow(10, Math.ceil(Math.log10(maxX)))])
        : d3.scaleLinear().domain([minX, maxX]);
    const yScaler =
      scale === "log"
        ? d3.scaleLog().domain([Math.max(0.01, Math.pow(10, Math.floor(Math.log10(minY)))), Math.pow(10, Math.ceil(Math.log10(maxY)))])
        : d3.scaleLinear().domain([minY, maxY]);

    const scaledSeries = filteredSeries.map((series) => ({
      ...series,
      data: series.data.map((item) => ({
        ...item,
        x: xScaler(item.x),
        y: yScaler(item.y),
      })),
    }));

    return [xScaler, yScaler, scaledSeries] as const;
  }, [filteredSeries, scale]);

  const seriesColors = useSeriesColors(scaledSeries);

  const chartOptions = useMemo(() => {
    const xTicks = xScaler.ticks();
    const yTicks = yScaler.ticks();
    const withXScaler = (fn: (...args: any) => {}) => (n: number, ...args: any) => fn(Math.round(xScaler.invert(n)), ...args);
    const withYScaler = (fn: (...args: any) => {}) => (n: number, ...args: any) => fn(Math.round(yScaler.invert(n)), ...args);

    return {
      chart: {
        animations: {
          animateGradually: { enabled: false },
        },
        toolbar: {
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: true,
          },
        },
        zoom: {
          type: "xy",
        },
      },
      grid: {
        xaxis: {
          lines: {
            show: true,
          },
        },
      },
      colors: seriesColors,
      stroke: {
        width: 2,
      },
      tooltip: {
        shared: false,
        intersect: true,
        y: {
          formatter: withYScaler((n: number) => `Weekly Confirmed ${titleCase(metric)}: ${displayNumberFormatter(n)}`),
        },
        x: {
          formatter: withXScaler(
            (n: number, point: any) =>
              `${displayNumberFormatter(n)} confirmed ${metric} at ${format(new Date(point?.w?.config?.series[point.seriesIndex].data[point.dataPointIndex].date), "PPP")}`
          ),
        },
      },
      legend: {
        position: "top",
      },
      xaxis: {
        type: "numeric",
        max: scale === "log" ? xScaler(last(xTicks)!) : undefined,
        min: scale === "log" ? xScaler(first(xTicks)!) : undefined,
        labels: {
          formatter: withXScaler((n: number) => (n < 1000 ? Math.round(n) : numberFormatter(n))),
        },
        title: {
          text: `Total Confirmed ${titleCase(metric)}`,
        },
        tooltip: {
          enabled: false,
        },
      },
      yaxis: {
        max: scale === "log" ? yScaler(last(yTicks)!) : undefined,
        min: scale === "log" ? yScaler(first(yTicks)!) : undefined,
        labels: {
          formatter: withYScaler((n: number) => (n < 1000 ? Math.round(n) : numberFormatter(n))),
        },
        title: {
          text: `New Confirmed ${titleCase(metric)} (in the Past Week)`,
        },
      },
      title: {
        text: title,
        style: {
          fontSize: "20px",
          fontFamily: "Lato, 'Helvetica Neue', Arial, Helvetica, sans-serif",
        },
      },
      markers: {
        size: 3,
        hover: {
          size: 5,
        },
      },
    };
  }, [title, metric, seriesColors, scale, xScaler, yScaler]);

  if (loading) {
    return (
      <div style={{ height: props.height, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Loader active inline />
      </div>
    );
  }

  return <ReactApexChart ref={ref} options={chartOptions} series={scaledSeries} type="line" {...rest} />;
}

export default React.forwardRef(TrendChart);

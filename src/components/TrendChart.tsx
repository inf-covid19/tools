import * as d3 from "d3";
import { format } from "date-fns";
import { first, last, sortBy, defaultTo } from "lodash";
import get from "lodash/get";
import React, { useMemo } from "react";
import ReactApexChart, { Props } from "react-apexcharts";
import { Loader } from "semantic-ui-react";
import useRegionData from "../hooks/useRegionData";
import useSeriesColors from "../hooks/useSeriesColors";
import { ChartOptions } from "./Editor";
import { getByRegionId } from "../utils/metadata";
import useMetadata from "../hooks/useMetadata";
import { titleCase } from "../utils/string";

const numberFormatter = d3.format(".2s");

const displayNumberFormatter = d3.format(",");

type TrendChartProps = Omit<Props, "options" | "series" | "type"> & Pick<ChartOptions, "selectedRegions" | "title" | "alignAt" | "metric" | "scale">;

function TrendChart(props: TrendChartProps, ref: React.Ref<any>) {
  const { selectedRegions, title, alignAt, metric, scale = "log", ...rest } = props;

  const regionsIds = useMemo(() => {
    return Object.keys(selectedRegions);
  }, [selectedRegions]);

  const { error, data, loading } = useRegionData(regionsIds);
  const { data: metadata } = useMetadata();

  const series = useMemo(() => {
    if (!data || !metadata) return [];

    const series = Object.entries(data).map(([regionId, regionData]) => {
      return {
        key: regionId,
        name: getByRegionId(metadata, regionId).displayName,
        data: regionData.flatMap((row, index) => {
          const valueColumn = metric;
          const valueDailyColumn = `${metric}_daily`;

          if (row[metric] < alignAt) return [];

          return [
            {
              date: row.date,
              x: row[valueColumn],
              y: defaultTo(
                regionData.slice(Math.max(0, index - 6), index + 1).reduce((sum, r) => sum + get(r, valueDailyColumn, 0), 0),
                0
              ),
            },
          ];
        }),
      };
    });

    return series.filter((s) => s.data.length > 0);
  }, [data, metadata, metric, alignAt]);

  const [xScaler, yScaler, scaledSeries] = useMemo(() => {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    series.forEach(({ data }) => {
      data.forEach(({ x, y }) => {
        minX = Math.min(x, minX);
        maxX = Math.max(x, maxX);
        minY = Math.min(y, minY);
        maxY = Math.max(y, maxY);
      });
    });

    const xScaler =
      scale === "log"
        ? d3.scaleLog().domain([Math.max(1, Math.pow(10, Math.floor(Math.log10(minX)))), Math.pow(10, Math.ceil(Math.log10(maxX)))])
        : d3.scaleLinear().domain([0, round(maxX)]);
    const yScaler =
      scale === "log"
        ? d3.scaleLog().domain([Math.max(1, Math.pow(10, Math.floor(Math.log10(minY)))), Math.pow(10, Math.ceil(Math.log10(maxY)))])
        : d3.scaleLinear().domain([0, round(maxY)]);

    const scaledSeries = series.map((series) => ({
      ...series,
      data: series.data.map((item) => ({
        ...item,
        x: defaultTo(xScaler(item.x), 0),
        y: defaultTo(yScaler(item.y), 0),
      })),
    }));

    return [xScaler, yScaler, scaledSeries];
  }, [series, scale]);

  const sortedSeries = useMemo(() => {
    return sortBy(scaledSeries, "name");
  }, [scaledSeries]);

  const seriesColors = useSeriesColors(sortedSeries);

  const chartOptions = useMemo(() => {
    const xTicks = xScaler.ticks();
    const yTicks = yScaler.ticks();

    const xTickAmount = Math.log10(last(xTicks)!) - Math.log10(first(xTicks)!);
    const yTickAmount = Math.log10(last(yTicks)!) - Math.log10(first(yTicks)!);

    const withXScaler = (fn: (...args: any) => {}) => (n: number, ...args: any) => fn(Math.round(xScaler.invert(n)), ...args);
    const withYScaler = (fn: (...args: any) => {}) => (n: number, ...args: any) => fn(Math.round(yScaler.invert(n)), ...args);

    return {
      chart: {
        fontFamily: "Lato, 'Helvetica Neue', Arial, Helvetica, sans-serif",
        animations: {
          animateGradually: { enabled: false },
        },
        toolbar: {
          tools: {
            download: false,
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
        curve: "straight",
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
        max: 1,
        min: 0,
        tickAmount: scale === "log" ? xTickAmount : undefined,
        labels: {
          formatter: withXScaler((n: number) => (n < 1000 ? Math.round(n) : numberFormatter(n))),
        },
        title: {
          text: `Total Confirmed ${metric === 'confirmed' ? 'Cases': 'Deaths'}`,
          offsetY: 10,
        },
        tooltip: {
          enabled: false,
        },
      },
      yaxis: {
        max: 1,
        min: 0,
        tickAmount: scale === "log" ? yTickAmount : undefined,
        axisTicks: {
          offsetX: 5,
        },
        axisBorder: {
          offsetX: 5,
        },
        labels: {
          offsetX: 5,
          formatter: withYScaler((n: number) => (n < 1000 ? Math.round(n) : numberFormatter(n))),
        },
        title: {
          offsetX: 5,
          text: `New Confirmed ${metric === 'confirmed' ? 'Cases': 'Deaths'} (in the Past Week)`,
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
        strokeWidth: 1,
        strokeOpacity: 0.7,
        hover: {
          sizeOffset: 3,
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

  if (error) {
    return (
      <div style={{ height: props.height, display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        Ooops! Something is wrong.
        <br />
        Please try it later or choose different regions.
      </div>
    );
  }

  return <ReactApexChart ref={ref} options={chartOptions} series={sortedSeries} type="line" height={rest.height} width={rest.width} />;
}

export default React.forwardRef(TrendChart);

const round = (n: number) => {
  let factor = 5;
  for (let x = 5; x * 2 <= n; x *= 10) {
    factor = x;
  }
  return Math.ceil(n / factor) * factor;
};

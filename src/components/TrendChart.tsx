import { format } from "date-fns";
import * as d3 from "d3";
import { last } from "lodash";
import get from "lodash/get";
import React, { useMemo } from "react";
import ReactApexChart, { Props } from "react-apexcharts";
import { Loader } from "semantic-ui-react";
import useRegionData from "../hooks/useRegionData";
import normalizeTimeseries from "../utils/normalizeTimeseries";
import { ChartOptions } from "./Editor";

const numberFormatter = d3.format(".2s");

const displayNumberFormatter = d3.format(",");

const titleCase = (word: string) => word.slice(0, 1).toUpperCase() + word.slice(1);

type TrendChartProps = Omit<Props, "options" | "series" | "type"> & Pick<ChartOptions, "selectedRegions" | "title" | "alignAt" | "metric">;

function TrendChart(props: TrendChartProps, ref: React.Ref<any>) {
  const { selectedRegions, title, alignAt, metric, ...rest } = props;

  const regionsIds = useMemo(() => {
    return Object.keys(selectedRegions);
  }, [selectedRegions]);

  const { data, loading } = useRegionData(regionsIds);

  const series = useMemo(() => {
    if (!data) return [];

    return Object.entries(data).map(([regionId, regionData]) => {
      const normalizedRegionData = normalizeTimeseries(regionId, regionData);

      return {
        key: regionId,
        name: last(regionId.split("."))!.replace(/_/g, " "),
        data: normalizedRegionData.flatMap((row, index) => {
          const valueColumn = metric;
          const valueDailyColumn = `${metric}_daily`;

          if (row.cases < alignAt) return [];

          return [
            {
              date: row.date,
              x: row[valueColumn],
              y: normalizedRegionData.slice(Math.max(0, index - 7), index).reduce((sum, r) => sum + get(r, valueDailyColumn, 0), 0),
            },
          ];
        }),
      };
    });
  }, [data, metric, alignAt]);

  const filteredSeries = useMemo(() => {
    return series.filter(({ key }) => !!selectedRegions[key]);
  }, [series, selectedRegions]);

  const seriesColors = useMemo(() => {
    return filteredSeries.map(({ key, name }) => {
      const hashCode = (str: string) => {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
      };
      const intToRGB = (i: number) => {
        var c = (i & 0x00ffffff).toString(16).toUpperCase();

        return "00000".substring(0, 6 - c.length) + c;
      };
      return "#" + intToRGB(hashCode(`${name}:${key}`));
    });
  }, [filteredSeries]);

  const chartOptions = useMemo(() => {
    return {
      chart: {
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
          autoScaleYaxis: true,
        },
      },
      colors: seriesColors,
      stroke: {
        // curve: "smooth",
        width: 2,
      },
      tooltip: {
        shared: false,
        intersect: true,
        y: {
          formatter: (n: number) => `Weekly Confirmed ${titleCase(metric)}: ${displayNumberFormatter(n)}`,
        },
        x: {
          formatter: (n: number, point: any) =>
            `${displayNumberFormatter(n)} confirmed ${metric} at ${format(new Date(point?.w?.config?.series[point.seriesIndex].data[point.dataPointIndex].date), "PPP")}`,
        },
      },
      legend: {
        position: "top",
      },
      xaxis: {
        type: "numeric",
        labels: {
          formatter: (n: number) => (n < 1000 ? Math.round(n) : numberFormatter(n)),
        },
        title: {
          text: `Total Confirmed ${titleCase(metric)}`,
        },
      },
      yaxis: {
        labels: {
          formatter: (n: number) => (n < 1000 ? Math.round(n) : numberFormatter(n)),
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
      },
    };
  }, [title, metric, seriesColors]);

  if (loading) {
    return (
      <div style={{ height: props.height, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Loader active inline />
      </div>
    );
  }

  return <ReactApexChart ref={ref} options={chartOptions} series={filteredSeries} type="line" {...rest} />;
}

export default React.forwardRef(TrendChart);

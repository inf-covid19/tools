import * as d3 from "d3";
import { subDays, startOfDay } from "date-fns";
import get from "lodash/get";
import last from "lodash/last";
import sortBy from "lodash/sortBy";
import numeral from "numeral";
import React, { useMemo } from "react";
import ReactApexChart, { Props } from "react-apexcharts";
import { Loader } from "semantic-ui-react";
import useRegionData from "../hooks/useRegionData";
import useSeriesColors from "../hooks/useSeriesColors";
import { alignTimeseries } from "../utils/normalizeTimeseries";
import { ChartOptions } from "./Editor";

const ordinalFormattter = (n: number) => numeral(n).format("Oo");
const numberFormatter = d3.format(".2s");

type CustomizableChartProps = Omit<Props, "options" | "series" | "type"> & ChartOptions;

function CustomizableChart(props: CustomizableChartProps, ref: React.Ref<any>) {
  const { chartType = "heatmap", title, metric, showDataLabels, isCumulative, dayInterval, selectedRegions, alignAt = 0, ...rest } = props;

  const regionsIds = useMemo(() => Object.keys(selectedRegions), [selectedRegions]);

  const { data, loading, error } = useRegionData(regionsIds);

  const series = useMemo(() => {
    if (loading || !data) {
      return [];
    }

    const earliestDate = subDays(startOfDay(new Date()), dayInterval);
    return Object.entries(data).map(([region, regionData]) => {
      if (alignAt > 0) {
        return {
          name: last(region.split("."))!.replace(/_/g, " "),
          key: region,
          data: regionData
            .filter((v) => v[metric] >= alignAt)
            .map((v, index) => ({
              x: index + 1,
              y: isCumulative ? v[metric] : v[`${metric}_daily` as "cases_daily" | "deaths_daily"],
            })),
        };
      }

      return {
        name: last(region.split("."))!.replace(/_/g, " "),
        key: region,
        data: alignTimeseries(regionData, earliestDate)
          .slice(-dayInterval)
          .map((row) => ({
            x: row.date.getTime(),
            y: row[`${metric}${isCumulative ? "" : "_daily"}` as "cases" | "deaths" | "cases_daily" | "deaths_daily"],
          })),
      };
    });
  }, [loading, data, dayInterval, alignAt, metric, isCumulative]);

  const sortedSeries = useMemo(() => {
    return sortBy(
      series.filter((s) => !!selectedRegions[s.key]),
      (s) => get(s.data, [s.data.length - 1, "y"])
    );
  }, [series, selectedRegions]);

  const seriesColors = useSeriesColors(sortedSeries);

  const chartOptions = useMemo(() => {
    return {
      chart: {
        toolbar: {
          tools: {
            download: true,
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
          formatter: (value: string) => `${value} ${metric}`,
        },
        x: {
          formatter: alignAt > 0 ? (value: number) => `${ordinalFormattter(value)} day after ${alignAt >= 1000 ? numberFormatter(alignAt) : alignAt} ${metric}` : undefined,
        },
      },
      xaxis: {
        type: alignAt === 0 ? "datetime" : "numeric",
        labels: {
          formatter: alignAt > 0 ? ordinalFormattter : undefined,
        },
      },
      dataLabels: {
        enabled: showDataLabels,
        formatter: (n: number) => (n >= 1000 ? numberFormatter(n) : n),
      },
      title: {
        text: title,
        style: {
          fontSize: "20px",
          fontFamily: "Lato, 'Helvetica Neue', Arial, Helvetica, sans-serif",
        },
      },
      subtitle: {
        text: `${isCumulative ? "Total" : "Daily"} number of ${metric}`,
        floating: true,
        style: {
          fontSize: "14px",
          fontFamily: "Lato, 'Helvetica Neue', Arial, Helvetica, sans-serif",
        },
      },
      plotOptions: {
        heatmap: {
          shadeIntensity: 0.0,
          colorScale: {
            ranges: [
              { from: 0, to: 10, name: "0-10", color: "#ffffd9", foreColor: "#0d0d0d" },
              { from: 11, to: 50, name: "11-50", color: "#edf8b1", foreColor: "#0d0d0d" },
              { from: 51, to: 100, name: "51-100", color: "#c7e9b4", foreColor: "#0d0d0d" },
              { from: 101, to: 250, name: "101-250", color: "#7fcdbb" },
              { from: 251, to: 500, name: "251-500", color: "#41b6c4" },
              { from: 501, to: 1000, name: "501-1000", color: "#1d91c0" },
              { from: 1001, to: 5000, name: "1001-5000", color: "#225ea8" },
              { from: 5001, to: 10000, name: "5001-10000", color: "#253494" },
              { from: 10001, to: 999999, name: "> 10000", color: "#081d58" },
            ],
          },
        },
      },
    };
  }, [title, metric, isCumulative, showDataLabels, alignAt, seriesColors]);

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
        <br/>Please try it later or choose different regions.
      </div>
    );
  }

  return <ReactApexChart key={chartType} ref={ref} options={chartOptions} series={sortedSeries} type={chartType} {...rest} />;
}

export default React.forwardRef(CustomizableChart);

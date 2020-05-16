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
import { alignTimeseries } from "../utils/normalizeTimeseries";
import { ChartOptions } from "./Editor";
import useColorScale from "../hooks/useColorScale";

const displayNumberFormatter = d3.format(",");
const ordinalFormattter = (n: number) => numeral(n).format("Oo");
const numberFormatter = d3.format(".2s");

type CustomizableChartProps = Omit<Props, "options" | "series" | "type"> & ChartOptions;

function CustomizableChart(props: CustomizableChartProps, ref: React.Ref<any>) {
  const { chartType = "heatmap", title, metric, showDataLabels, isCumulative, dayInterval, selectedRegions, alignAt = 0, timeserieSlice, ...rest } = props;

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

      if (alignAt > 0) {
        const alignedData = regionData.filter((v) => v[metric] >= alignAt);

        if (alignedData.length === 0) {
          return [];
        }

        return [
          {
            name,
            key: region,
            data: alignedData.map((v, index) => ({
              x: index + 1,
              y: isCumulative ? v[metric] : v[`${metric}_daily` as "cases_daily" | "deaths_daily"],
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
            y: row[`${metric}${isCumulative ? "" : "_daily"}` as "cases" | "deaths" | "cases_daily" | "deaths_daily"],
          })),
        },
      ];
    });
  }, [loading, data, dayInterval, alignAt, metric, isCumulative, metadata]);

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
          formatter: (value: number) => `${displayNumberFormatter(value)} ${metric}`,
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
          colorScale,
        },
      },
    };
  }, [seriesColors, alignAt, showDataLabels, title, isCumulative, metric, colorScale]);

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

  return <ReactApexChart key={chartType} ref={ref} options={chartOptions} series={sortedSeries} type={chartType} {...rest} />;
}

export default React.forwardRef(CustomizableChart);

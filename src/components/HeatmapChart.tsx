import React, { useMemo } from "react";
import useRegionData from "../hooks/useRegionData";
import { eachDayOfInterval, subDays, format } from "date-fns";
import sortBy from "lodash/sortBy";
import last from "lodash/last";
import ReactApexChart, { Props } from "react-apexcharts";

type HeatmapChartProps  = Omit<Props, 'options' | 'series' | 'type'> & {
  title: string;
  metric: "cases" | "deaths";
  showDataLabels: boolean;
  isCumulative: boolean;
  dayInterval: number;
  selectedCountries: Record<string, boolean>;
};

export default function HeatmapChart(props: HeatmapChartProps) {
  const { title, metric, showDataLabels, isCumulative, dayInterval, selectedCountries, ...rest } = props;

  const timeline = useMemo(
    () =>
      eachDayOfInterval({
        start: subDays(new Date(), dayInterval),
        end: new Date(),
      }),
    [dayInterval]
  );

  const regionsIds = useMemo(() => Object.keys(selectedCountries), [selectedCountries]);

  const { data, loading } = useRegionData(regionsIds);

  const series = useMemo(() => {
    if (loading || !data) {
      return [];
    }

    return Object.entries(data).map(([country, countryData]) => {
      let cumulativeValue = 0;

      const countryDataByDate = countryData.reduceRight<Record<string, any>>((acc, curr) => {
        const value = parseInt(curr[metric] || '0');
        const date = curr["dateRep"] as string;
        cumulativeValue += value;
        acc[date] = {
          ...curr,
          [metric]: isCumulative ? cumulativeValue : value,
        };
        return acc;
      }, {});

      let prevValue = 0;
      const countrySeries = timeline.map(date => {
        const dateData = countryDataByDate[format(date, "dd/MM/yyyy")];
        const value = {
          x: format(date, "dd/MM"),
          y: dateData ? dateData[metric] : isCumulative ? prevValue : 0,
        };
        prevValue = value.y;
        return value;
      });

      return {
        name: country,
        data: countrySeries,
      };
    });
  }, [data, loading, timeline, isCumulative, metric]);

  const sortedSeries = useMemo(() => {
    return sortBy(
      series.filter(s => !!selectedCountries[s.name]),
      s => last(s.data)?.y
    );
  }, [series, selectedCountries]);

  const chartOptions = useMemo(() => {
    return {
      chart: {
        height: 500,
        type: "heatmap",
      },
      dataLabels: {
        enabled: showDataLabels,
      },
      title: {
        text: title,
        style: {
          fontSize: "20px",
        },
      },
      plotOptions: {
        heatmap: {
          shadeIntensity: 0.0,
          colorScale: {
            ranges: [
              { from: 0, to: 10, name: "0-10", color: "#efefef" },
              { from: 11, to: 50, name: "11-50", color: "#fff2cc" },
              { from: 51, to: 100, name: "51-100", color: "#f9cb9c" },
              { from: 101, to: 250, name: "101-250", color: "#e69138" },
              { from: 251, to: 500, name: "251-500", color: "#b45f06" },
              { from: 501, to: 1000, name: "501-1000", color: "#ea9999" },
              { from: 1001, to: 5000, name: "1001-5000", color: "#85200c" },
              { from: 5001, to: 999999, name: "> 5001", color: "#000000" },
            ],
          },
        },
      },
    };
  }, [title, showDataLabels]);

  if (loading) {
    return <div style={{ height: props.height, display: "flex", justifyContent: "center", alignItems: "center" }}>Loading...</div>;
  }

  return (
      <ReactApexChart options={chartOptions} series={sortedSeries} type="heatmap" {...rest} />
  );
}

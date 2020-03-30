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

function HeatmapChart(props: HeatmapChartProps, ref: React.Ref<any>) {
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
              { from: 0, to: 10, name: "0-10", color: "#ffffd9" },
              { from: 11, to: 50, name: "11-50", color: "#edf8b1" },
              { from: 51, to: 100, name: "51-100", color: "#c7e9b4" },
              { from: 101, to: 250, name: "101-250", color: "#7fcdbb" },
              { from: 251, to: 500, name: "251-500", color: "#41b6c4" },
              { from: 501, to: 1000, name: "501-1000", color: "#1d91c0" },
              { from: 1001, to: 5000, name: "1001-5000", color: "#225ea8" },
              { from: 5001, to: 10000, name: "5001-10000", color: "#253494" },
              { from: 10001, to: 999999, name: "> 10001", color: "#081d58" },
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
      <ReactApexChart ref={ref} options={chartOptions} series={sortedSeries} type="heatmap" {...rest} />
  );
}


export default React.forwardRef(HeatmapChart);
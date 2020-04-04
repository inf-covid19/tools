import * as d3 from "d3";
import { addDays, eachDayOfInterval, format, isAfter, subDays } from "date-fns";
import findLastIndex from "lodash/findLastIndex";
import get from "lodash/get";
import last from "lodash/last";
import sortBy from "lodash/sortBy";
import PolynomialRegression from "ml-regression-polynomial";
import numeral from "numeral";
import React, { useMemo } from "react";
import ReactApexChart, { Props } from "react-apexcharts";
import { Loader } from "semantic-ui-react";
import useRegionData from "../hooks/useRegionData";
import normalizeTimeseries from "../utils/normalizeTimeseries";
import { ChartOptions } from "./Editor";
import useSeriesColors from "../hooks/useSeriesColors";

const ordinalFormattter = (n: number) => numeral(n).format("Oo");
const numberFormatter = d3.format(".2s");

type PredictionsChartProps = Omit<Props, "options" | "series" | "type"> & ChartOptions;

function PredictionsChart(props: PredictionsChartProps, ref: React.Ref<any>) {
  const { chartType = "line", title, metric, showDataLabels, isCumulative, dayInterval, selectedRegions, alignAt = 0, predictionDays, ...rest } = props;

  const timeline = useMemo(
    () =>
      eachDayOfInterval({
        start: subDays(new Date(), dayInterval),
        end: new Date(),
      }),
    [dayInterval]
  );

  const regionsIds = useMemo(() => Object.keys(selectedRegions), [selectedRegions]);

  const { data, loading } = useRegionData(regionsIds);

  const series = useMemo(() => {
    if (loading || !data) {
      return [];
    }

    return Object.entries(data).map(([region, regionData]) => {
      let normalizedRegionData = normalizeTimeseries(region, regionData);

      return {
        name: last(region.split("."))?.replace(/_/g, " "),
        key: region,
        data: normalizedRegionData,
      };
    });
  }, [data, loading]);

  const filteredSeries = useMemo(() => {
    return series.filter((s) => !!selectedRegions[s.key]);
  }, [series, selectedRegions]);

  const seriesWithPredictions = useMemo(
    () =>
      filteredSeries.flatMap((serie: any) => {
        const { X, Y } = serie.data.reduce(
          (acc: any, row: any, index: number) => {
            return {
              X: [...acc.X, index],
              Y: [...acc.Y, row[metric]],
            };
          },
          { X: [], Y: [] }
        );

        const degree = 3;
        const regression = new PolynomialRegression(X, Y, degree);
        const pred = (n: number) => Math.round(regression.predict(n));

        const lastDate = (last(serie.data) as any).date;

        const predictionSerie = eachDayOfInterval({
          start: lastDate,
          end: addDays(lastDate, predictionDays),
        });

        const predictionLastDiff = (last(serie.data) as any)[metric] - pred(X.length - 1);
        const nextSeriePredictions = predictionSerie.slice(1).map((date, index) => {
          return {
            date: alignAt > 0 ? X.length + index + 1 : date,
            [metric]: pred(X.length + index) + predictionLastDiff,
          };
        });

        let serieData = serie.data;

        const timelineDiff = timeline.length - serieData.length;
        if (timelineDiff > 0) {
          serieData = [
            ...timeline.slice(0, timelineDiff).map((d) => ({
              date: d,
              [metric]: 0,
            })),
            ...serieData,
          ];
        }

        return [
          {
            ...serie,
            data: serieData
              .slice(-dayInterval)
              .concat(nextSeriePredictions)
              .map((row: any) => ({
                x: row.date.getTime(),
                y: row[metric],
              })),
          },
        ];
      }),
    [alignAt, dayInterval, filteredSeries, metric, predictionDays, timeline]
  );

  const sortedSeries = useMemo(() => {
    let desiredIndex = 0;
    seriesWithPredictions.forEach((series) => {
      desiredIndex = Math.max(
        desiredIndex,
        findLastIndex(series.data, (s: any) => !!s.y)
      );
    });
    return sortBy(seriesWithPredictions, (s) => get(s.data, [alignAt > 0 ? s.data.length - 1 : desiredIndex, "y"]));
  }, [seriesWithPredictions, alignAt]);


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
          formatter:
            alignAt > 0
              ? (value: number) => `${ordinalFormattter(value)} day after ${alignAt >= 1000 ? numberFormatter(alignAt) : alignAt} ${metric}`
              : (date: number) => {
                  const pointDate = new Date(date);
                  const isPrediction = isAfter(pointDate, subDays(new Date(), 1)); // TODO: improve way to know if it's prediction based on series
                  return `${format(new Date(date), "PPP")}${isPrediction ? " (Prediction)" : ""}`;
                },
        },
      },
      xaxis: {
        type: alignAt === 0 ? "datetime" : "numeric",
        labels: {
          formatter: alignAt > 0 ? ordinalFormattter : undefined,
        },
      },
      annotations: {
        xaxis: [
          {
            x: subDays(new Date(), 1).getTime(), // TODO: get this from where we calculated predictions
            x2: addDays(new Date(), predictionDays).getTime(), // TODO: get this from where we calculated predictions
            fillColor: "#0000FF",
            opacity: chartType === "heatmap" ? 0.1 : 0.1,
            label: {
              text: "Prediction",
            },
          },
        ],
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
  }, [title, metric, isCumulative, showDataLabels, alignAt, predictionDays, chartType, seriesColors]);

  if (loading) {
    return (
      <div style={{ height: props.height, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Loader active inline />
      </div>
    );
  }

  return <ReactApexChart key={chartType} ref={ref} options={chartOptions} series={sortedSeries} type={chartType} {...rest} />;
}

export default React.forwardRef(PredictionsChart);

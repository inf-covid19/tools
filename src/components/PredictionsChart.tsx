import * as d3 from "d3";
import { addDays, eachDayOfInterval, format, startOfDay, subDays } from "date-fns";
import get from "lodash/get";
import last from "lodash/last";
import sortBy from "lodash/sortBy";
import PolynomialRegression from "ml-regression-polynomial";
import numeral from "numeral";
import React, { useMemo } from "react";
import ReactApexChart, { Props } from "react-apexcharts";
import { Loader } from "semantic-ui-react";
import useMetadata from "../hooks/useMetadata";
import useRegionData from "../hooks/useRegionData";
import useSeriesColors from "../hooks/useSeriesColors";
import { getByRegionId } from "../utils/metadata";
import { alignTimeseries } from "../utils/normalizeTimeseries";
import { ChartOptions } from "./Editor";
import useColorScale from "../hooks/useColorScale";
import { isNumber } from "lodash";
import { titleCase } from "../utils/string";

const displayNumberFormatter = d3.format(",.2~f");
const ordinalFormattter = (n: number) => numeral(n).format("Oo");
const numberFormatter = d3.format(".2~s");

type PredictionsChartProps = Omit<Props, "options" | "series" | "type"> & ChartOptions;

function PredictionsChart(props: PredictionsChartProps, ref: React.Ref<any>) {
  const { chartType = "line", title, metric, showDataLabels, isCumulative, dayInterval, selectedRegions, alignAt = 0, predictionDays, ...rest } = props;

  const regionsIds = useMemo(() => Object.keys(selectedRegions), [selectedRegions]);

  const { data, loading, error } = useRegionData(regionsIds);
  const { data: metadata } = useMetadata();

  const series = useMemo(() => {
    if (!data || !metadata) {
      return [];
    }

    return Object.entries(data).map(([key, data]) => {
      return {
        name: getByRegionId(metadata, key).displayName,
        key,
        data,
      };
    });
  }, [data, metadata]);

  const filteredSeries = useMemo(() => {
    return series.filter((s) => !!selectedRegions[s.key]);
  }, [series, selectedRegions]);

  const seriesWithPredictions = useMemo(() => {
    return filteredSeries.flatMap((serie) => {
      const dataSinceFirstCase = serie.data.filter((d) => d.cases > 0);
      const getNextSeriesPrediction = () => {
        const { X, Y } = dataSinceFirstCase.slice(-Math.max(dayInterval, 2)).reduce<{ X: number[]; Y: number[] }>(
          (acc, row, index) => {
            return {
              X: [...acc.X, index],
              Y: [...acc.Y, metric === "cases" ? row.cases_daily : row.deaths_daily],
            };
          },
          { X: [], Y: [] }
        );
        const degree = X.length > 2 ? 3 : 1;
        const regression = new PolynomialRegression(X, Y, degree);
        const pred = (n: number) => Math.round(regression.predict(n));
        const lastDate = last(dataSinceFirstCase)!.date;
        const predictionSerie = eachDayOfInterval({
          start: lastDate,
          end: addDays(lastDate, predictionDays),
        });
        const fActual = last(Y)!;
        const fPrediction = pred(X.length - 1);
        const F = Math.max(fPrediction, 0) === 0 ? 1 : fActual / fPrediction;

        const Ka = dataSinceFirstCase.filter((x) => x.cases > 300).length;
        const K = Math.max(0, 150 - Ka);

        return predictionSerie.slice(1).reduce<any[]>((arr, date, index) => {
          const Ki = K === 0 ? 0 : Math.max(0, (K - index) / K);
          const predValue = pred(X.length + index) * F * Ki;
          const lastMetric = (arr[index - 1] || last(dataSinceFirstCase))[metric] as number;

          arr.push({
            date: date,
            [metric]: Math.round(Math.max(lastMetric + predValue, lastMetric)),
            isPrediction: true,
          });
          return arr;
        }, []);
      };

      const nextSeriePredictions = dataSinceFirstCase.length > 2 ? getNextSeriesPrediction() : [];

      const serieData = alignTimeseries(dataSinceFirstCase, subDays(startOfDay(new Date()), dayInterval));

      return [
        {
          ...serie,
          data: serieData.concat(nextSeriePredictions).map((row: any) => ({
            x: row.date.getTime(),
            y: row[metric],
            isPrediction: row.isPrediction || false,
          })),
        },
      ];
    });
  }, [dayInterval, filteredSeries, metric, predictionDays]);

  const sortedSeries = useMemo(() => {
    return sortBy(seriesWithPredictions, chartType === "heatmap" ? (s) => get(s.data, [s.data.length - 1, "y"], 0) : "name");
  }, [chartType, seriesWithPredictions]);

  const [predictionX1, predictionX2] = useMemo(() => {
    let x1 = startOfDay(new Date()).getTime();
    let x2 = addDays(startOfDay(new Date()), predictionDays).getTime();

    sortedSeries.forEach(({ data }) => {
      const predictions = data.filter((d) => d.isPrediction);

      x1 = Math.min(x1, ...predictions.map((d) => d.x));
      x2 = Math.max(x2, ...predictions.map((d) => d.x));
    });

    return [x1, x2];
  }, [sortedSeries, predictionDays]);

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
            const pointData = point?.w?.config?.series[point.seriesIndex].data[point.dataPointIndex];
            return `${displayNumberFormatter(value)} ${metric}${pointData && pointData.isPrediction ? " (Prediction)" : ""}`;
          },
        },
        x: {
          formatter:
            alignAt > 0
              ? (value: number) => `${ordinalFormattter(value)} day after ${alignAt >= 1000 ? numberFormatter(alignAt) : alignAt} ${metric}`
              : (date: number) => `${format(new Date(date), "PPP")}`,
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
          text: chartType === "heatmap" ? undefined : `${isCumulative ? "Total" : "Daily"} Confirmed ${titleCase(metric)}`,
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
            x: predictionX1,
            x2: predictionX2,
            fillColor: "#0000FF",
            opacity: chartType === "heatmap" ? 0.0 : 0.1,
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
      plotOptions: {
        heatmap: {
          colorScale,
        },
      },
    };
  }, [seriesColors, alignAt, predictionX1, predictionX2, chartType, showDataLabels, title, isCumulative, metric, colorScale]);

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

export default React.forwardRef(PredictionsChart);

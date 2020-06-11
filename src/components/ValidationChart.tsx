import * as d3 from "d3";
import { addDays, eachDayOfInterval, differenceInCalendarDays, format, startOfDay, subDays } from "date-fns";
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

export type ValidationChartProps = Omit<Props, "options" | "series" | "type"> & ChartOptions;

function ValidationChart(props: ValidationChartProps, ref: React.Ref<any>) {
  const { chartType = "line", title, metric, showDataLabels, isCumulative, dayInterval, selectedRegions, alignAt = 0, predictionDays, validatePrediction, ...rest } = props;

  const predPreviousDate = validatePrediction ? subDays(new Date(), dayInterval) : null;

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

      const TEST_SIZE = 7;
      const TRAIN_SIZE = dataSinceFirstCase.length;

      const reduceFunction = (slice: any) => {
        return slice.reduce(
          (acc: { X: any; Y: any }, row: { cases: any; deaths: any }, index: any) => ({
            X: [...acc.X, index],
            Y: [...acc.Y, metric === "cases" ? row.cases : row.deaths],
          }),
          { X: [], Y: [] }
        );
      };

      const testSlice = reduceFunction(dataSinceFirstCase.slice(-TEST_SIZE));

      const mean = (list: any) => list.reduce((prev: any, curr: any) => prev + curr) / list.length;

      const regressors = [...Array(Math.min(TRAIN_SIZE))].flatMap((_, index: number) => {
        const { X, Y } = reduceFunction(dataSinceFirstCase.slice(-(2 * TEST_SIZE + index)).slice(0, TEST_SIZE + index));

        // regressor degrees
        return [2].map((v) => {
          const degree = X.length > 2 ? v : 1;
          const regressor = new PolynomialRegression(X, Y, degree);
          const pred = (n: number) => Math.round(regressor.predict(n));

          const seErrors = testSlice.Y.map((realValue: number, index: number) => {
            const predValue = pred(Y.length + index);
            return Math.pow(realValue - predValue, 2);
          });

          return {
            regressor,
            mse: mean(seErrors),
            X,
            Y,
          };
        });
      });
      const mseErrors = regressors.map((r) => r.mse);
      const minErrorIndex = mseErrors.indexOf(Math.min(...mseErrors));
      const { X, regressor } = regressors[minErrorIndex];
      const pred = (n: number) => Math.round(regressor.predict(n));
      const lastDate = last(dataSinceFirstCase)!.date;
      const predictionSerie = eachDayOfInterval({
        start: lastDate,
        end: addDays(lastDate, predictionDays),
      });
      const fActual = last(testSlice.Y)! as number;
      const fPrediction = pred(X.length + TEST_SIZE - 1);
      const predDiff = fActual - fPrediction;

      const nextSeriePredictions = predictionSerie.slice(1).reduce<any[]>((arr, date, index) => {
        const predValue = pred(X.length + TEST_SIZE + index) + predDiff;
        const lastMetric = (arr[index - 1] || last(dataSinceFirstCase))[metric] as number;

        arr.push({
          date: date,
          [metric]: Math.round(Math.max(predValue, lastMetric)),
          isPrediction: true,
        });
        return arr;
      }, []);

      const serieData = alignTimeseries(dataSinceFirstCase, subDays(startOfDay(new Date()), dayInterval));
      if (dataSinceFirstCase.length <= 2) {
        return [
          {
            ...serie,
            data: serieData.map((row) => ({
              x: row.date.getTime(),
              y: row[metric],
              isPrediction: false,
            })),
          },
        ];
      }

      let previousSerie: { name: string; key: string; data: { x: any; y: number; isPrediction: any }[] }[] = [];

      if (predPreviousDate) {
        console.log("prev date", predPreviousDate);
        // console.log("serie", serie);
        // console.log("last date", lastDate);
        // const nextDate = addDays(new Date(), predictionDays);
        // console.log("next date", nextDate);
        const previousPredictionSerie = eachDayOfInterval({
          start: predPreviousDate,
          end: lastDate,
        });
        // console.log("previous serie", previousPredictionSerie);
        const diffDays = differenceInCalendarDays(predPreviousDate, lastDate);
        // console.log("dif days", diffDays);
        // console.log("serieData", serieData);
        // console.log("serieData sliced", serieData.slice(0, diffDays));

        console.log("predDiff", predDiff);
        console.log("X len", X.length);
        console.log("Test Size", TEST_SIZE);
        console.log("diff days", diffDays);
        console.log("minErrorIndex", minErrorIndex);
        const previousSeriePredictions = previousPredictionSerie.slice(1).reduce<any[]>((arr, date, index) => {
          const predValue = pred(X.length + TEST_SIZE + index + diffDays) + predDiff;
          console.log("predicting", X.length + TEST_SIZE + index + diffDays, "=", predValue);
          // const lastMetric = (arr[index - 1] || last(dataSinceFirstCase))[metric] as number;

          arr.push({
            date: date,
            [metric]: Math.round(predValue),
            isPrediction: true,
          });
          return arr;
        }, []);

        previousSerie = [regressors[minErrorIndex]].map((r) => {
          return {
            name: serie.name + " (Validation)",
            key: serie.key + "__Validation",
            data: serieData
              .slice(0, diffDays)
              .concat(previousSeriePredictions)
              .map((row: any, index) => {
                return {
                  x: row.date.getTime(),
                  y: row[metric],
                  isPrediction: row.isPrediction || false,
                };
              }),
          };
        });

        console.log("prev serie", previousSerie[0]);
      }

      return [
        {
          ...serie,
          data: serieData.concat(predPreviousDate ? [] : nextSeriePredictions).map((row: any) => ({
            x: row.date.getTime(),
            y: row[metric],
            isPrediction: row.isPrediction || false,
          })),
        },
        ...previousSerie,
        // previousSerie,
        // ...[regressors[minErrorIndex]].map((r, index) => {
        //   const pred = (n: number) => Math.round(r.regressor.predict(n));
        //   return {
        //     name: serie.name + " (Prediction) " + (TEST_SIZE + X.length) + " " + regressor.degree,
        //     key: serie.key + "__Prediction" + (TEST_SIZE + X.length) + " " + regressor.degree,
        //     data: serieData.concat(nextSeriePredictions).map((row: any, index) => {
        //       return {
        //         x: row.date.getTime(),
        //         y: pred(index + minErrorIndex),
        //         isPrediction: row.isPrediction || false,
        //       };
        //     }),
        //   };
        // }),
      ];
    });
  }, [dayInterval, filteredSeries, metric, predPreviousDate, predictionDays]);

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

export default React.forwardRef(ValidationChart);

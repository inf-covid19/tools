import * as d3 from "d3";
import { format } from "date-fns";
import sortBy from "lodash/sortBy";
import PolynomialRegression from "ml-regression-polynomial";
import numeral from "numeral";
import React, { useMemo, useState, useEffect } from "react";
import ReactApexChart, { Props } from "react-apexcharts";
import { Loader } from "semantic-ui-react";
import useMetadata from "../hooks/useMetadata";
import useRegionData from "../hooks/useRegionData";
import { getByRegionId } from "../utils/metadata";
import { alignTimeseries } from "../utils/normalizeTimeseries";
import { ChartOptions } from "./Editor";
import { isNumber, first, last, debounce } from "lodash";
import { titleCase } from "../utils/string";

const displayNumberFormatter = d3.format(",.2~f");
const increaseNumberFormatter = d3.format("+.1~f");
const ordinalFormattter = (n: number) => numeral(n).format("Oo");
const numberFormatter = d3.format(".2~s");

export type ValidationChartProps = Omit<Props, "options" | "series" | "type"> & ChartOptions;

type ChartSerie = {
  name: string;
  key: string;
  data: {
    x: number;
    y: number;
    isPrediction: boolean;
    rawValue: number;
  }[];
};

function ValidationChart(props: ValidationChartProps, ref: React.Ref<any>) {
  const { chartType = "line", title, metric, showDataLabels, isCumulative, dayInterval, selectedRegions, alignAt = 0, predictionDays, validatePrediction, ...rest } = props;

  const regionsIds = useMemo(() => Object.keys(selectedRegions), [selectedRegions]);

  const { data, error } = useRegionData(regionsIds);
  const { data: metadata } = useMetadata();
  const [seriesWithPredictions, setSeriesWithPredictions] = useState([] as ChartSerie[]);

  const [chartLoading, setChartLoading] = useState(true);

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

  useEffect(() => {
    new Promise((resolve) => {
      filteredSeries.flatMap((serie) => {
        const dataSinceFirstCase = serie.data.filter((d) => d.cases > 0);

        const reduceToTrainData = (slice: any) => {
          return slice.reduce(
            (acc: { X: any; Y: any }, row: { cases: any; deaths: any }, index: any) => ({
              X: [...acc.X, index],
              Y: [...acc.Y, metric === "cases" ? row.cases : row.deaths],
            }),
            { X: [], Y: [] }
          );
        };
        const mean = (list: any) => list.reduce((prev: any, curr: any) => prev + curr) / list.length;
        const getBestModel = (sliceIndex: number, threshold: number) => {
          const testData = reduceToTrainData(dataSinceFirstCase.slice(sliceIndex - threshold, sliceIndex)).Y;

          const regressors = [...Array(sliceIndex)].flatMap((_, index: number) => {
            const { X, Y } = reduceToTrainData(dataSinceFirstCase.slice(index, sliceIndex - threshold));

            // regressor degrees
            return [2].flatMap((v) => {
              try {
                const degree = X.length > 2 ? v : 1;
                const regressor = new PolynomialRegression(X, Y, degree);
                const pred = (n: number) => Math.round(regressor.predict(n));

                const seErrors = testData.map((realValue: number, index: number) => {
                  const predValue = pred(Y.length + index);
                  return Math.pow(realValue - predValue, 2);
                });

                return {
                  regressor,
                  mse: mean(seErrors),
                  X,
                  Y,
                };
              } catch (error) {
                return [];
              }
            });
          });
          const mseErrors = regressors.map((r) => r.mse);
          const minErrorIndex = mseErrors.indexOf(Math.min(...mseErrors));
          return regressors[minErrorIndex];
        };

        const BASE_INDEX = 30;
        const seriesNData = [1, 5, 10, 20, 30].map((threshold) => {
          const serieName = threshold.toString().padStart(2, "0") + "d";
          return {
            name: serieName,
            key: serieName,
            data: dataSinceFirstCase
              .slice(BASE_INDEX)
              .flatMap((row, index) => {
                const bestModel = getBestModel(BASE_INDEX + index, threshold);

                if (!bestModel) return [];

                const predFn = (n: number) => Math.round(bestModel.regressor.predict(n));

                const fActual = last(bestModel.Y)! as number;
                const fPrediction = predFn(bestModel.X.length - 1);
                const predDiff = fActual - fPrediction;

                const predIndex = bestModel.X.length + threshold;

                const predValue = predFn(predIndex) + predDiff;

                const rawValue = dataSinceFirstCase[BASE_INDEX + index][metric];

                const errorFromRaw = (predValue - rawValue) / predValue;

                return {
                  x: row.date.getTime(),
                  y: errorFromRaw * 100,
                  isPrediction: true,
                  rawValue: predValue,
                };
              })
              .slice(-BASE_INDEX),
          };
        });

        const serieData = alignTimeseries(dataSinceFirstCase, first(dataSinceFirstCase)!.date);
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

        resolve([
          {
            ...serie,
            data: serieData
              .map((row: any) => ({
                x: row.date.getTime(),
                y: 0,
                isPrediction: row.isPrediction || false,
                rawValue: row[metric],
              }))
              .slice(-BASE_INDEX),
          },
          ...seriesNData,
        ]);
      });
    })
      .then((result) => {
        debounce(() => {
          setSeriesWithPredictions(result as ChartSerie[]);
          setChartLoading(false);
        }, 500)();
      })
      .catch((err) => {
        console.log(err);
      });
  }, [filteredSeries, metric]);

  const sortedSeries = useMemo(() => {
    return sortBy(seriesWithPredictions, "name");
  }, [seriesWithPredictions]);

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
      tooltip: {
        y: {
          formatter: (value: number, point: any) => {
            const pointData = point?.w?.config?.series[point.seriesIndex].data[point.dataPointIndex];
            return `${displayNumberFormatter(pointData.rawValue)} ${metric}${pointData && pointData.isPrediction ? ` (Prediction) (${increaseNumberFormatter(value)}%)` : ""}`;
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
          enableShades: false,
          colorScale: {
            ranges: [
              { color: "#67001F", name: "< -5", from: Number.MIN_SAFE_INTEGER, to: -5 },
              { color: "#B2182B", from: -4.99, to: -4 },
              { color: "#D6604D", from: -3.99, to: -3 },
              { color: "#F4A582", from: -2.99, to: -2 },
              { color: "#FDDBC7", from: -1.99, to: -1 },
              { color: "#CCCCCC", from: -0.99, to: 1 },
              { color: "#D1E5F0", from: 1.01, to: 2 },
              { color: "#92C5DE", from: 2.01, to: 3 },
              { color: "#4393C3", from: 3.01, to: 4 },
              { color: "#2166AC", from: 4.01, to: 5 },
              { color: "#053061", name: "5 > ", from: 5, to: Number.MAX_SAFE_INTEGER },
            ],
          },
        },
      },
    };
  }, [alignAt, chartType, showDataLabels, title, isCumulative, metric]);

  if (chartLoading) {
    return (
      <div style={{ height: props.height, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Loader active inline />
        Loading
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

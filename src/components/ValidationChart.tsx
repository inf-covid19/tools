import * as d3 from "d3";
import { format } from "date-fns";
import PolynomialRegression from "ml-regression-polynomial";
import numeral from "numeral";
import React, { useMemo, useState, useEffect } from "react";
import ReactApexChart, { Props } from "react-apexcharts";
import { Dimmer, Loader } from "semantic-ui-react";
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
const predErrorFormatter = d3.format("+");

const ax = [0.0, 1.0, 2.0, 3.0, 4.0, 5.0];
const ay = [0.0, 0.8, 0.9, 0.1, -0.8, -1.0];
const az = new PolynomialRegression(ax, ay, 3);

console.log("11", az.predict(0.5));
console.log("11", az.predict(3.5));
console.log("11", az.predict(10));

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
  const { chartType = "heatmap", title, metric, showDataLabels, isCumulative, dayInterval, selectedRegions, alignAt = 0, predictionDays, validatePrediction, ...rest } = props;

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
    setTimeout(() => {
      const loadPredictionErrorsPromise = new Promise((resolve) => {
        filteredSeries.flatMap((serie) => {
          const dataSinceFirstCase = serie.data.filter((d) => d.cases > 0).slice(-70);

          // console.log("datasincefirstcase");
          // console.log(dataSinceFirstCase);

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
            // console.log("mseErrors", mseErrors);
            // console.log("minErrorIndex", minErrorIndex);
            // console.log("regressors", regressors);
            return regressors[minErrorIndex];
          };

          const BASE_INDEX = 30;
          // console.log("Best model", 1, getBestModel(BASE_INDEX + 1, 1));
          const seriesNData = [1, 5, 10, 20, 30].map((threshold) => {
            const serieName = threshold + "d";
            // console.log("--------------");
            return {
              name: serieName,
              key: serieName,
              data: dataSinceFirstCase
                .slice(BASE_INDEX)
                .flatMap((row, index) => {
                  const bestModel = getBestModel(BASE_INDEX + index, threshold);

                  // console.log("bestModel", index, bestModel.mse);

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
                    rawError: predValue - rawValue,
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
      });
      Promise.all([loadPredictionErrorsPromise])
        .then((result) => {
          console.log("Local result");
          console.log(result[0]);

          fetch(`http://localhost:8000/api/v1/predictions/${metric}/errors`, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              records: filteredSeries[0].data.filter((d) => d.cases > 0),
              thresholds: [1, 5, 10, 20, 30],
            }),
          })
            .then((res) => {
              res.json().then((json) => {
                console.log("json", json);

                const dataSinceFirstCase = filteredSeries[0].data.filter((d) => d.cases > 0).slice(-50);

                const serieData = alignTimeseries(dataSinceFirstCase, first(dataSinceFirstCase)!.date);

                const bla = [
                  {
                    ...filteredSeries[0],
                    data: serieData
                      .map((row: any) => ({
                        x: row.date.getTime(),
                        y: 0,
                        isPrediction: row.isPrediction || false,
                        rawValue: row[metric],
                      }))
                      .slice(-30),
                  },
                  // ...seriesNData,
                ].concat(
                  json.series.map((errorSerie: any) => {
                    // console.log("errorSerie", errorSerie);
                    return {
                      name: `${errorSerie.threshold}d`,
                      key: `${errorSerie.threshold}d`,
                      data: errorSerie.data.map((row: any) => ({
                        ...row,
                        x: new Date(row.x).getTime(),
                      })),
                    };
                  })
                );

                console.log("bla", bla);
                setSeriesWithPredictions(bla as ChartSerie[]);
                setChartLoading(false);
              });
            })
            .catch((err) => {
              console.log("err", err);
            });

          // debounce(() => {
          //   setSeriesWithPredictions(result[0] as ChartSerie[]);
          //   setChartLoading(false);
          // }, 500)();
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }, [filteredSeries, metric]);

  const sortedSeries = useMemo(() => {
    return [...seriesWithPredictions].reverse();
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
        formatter: (n: number, point: any) => {
          const pointData = point?.w?.config?.series[point.seriesIndex].data[point.dataPointIndex];
          const value = pointData.rawValue;

          const error = pointData.rawError | 0;

          return [value >= 1000 ? numberFormatter(value) : value, error ? predErrorFormatter(error) : ""];
        },
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
              { color: "#67001F", name: "< -5", from: Number.MIN_SAFE_INTEGER, to: -5.01 },
              { color: "#B2182B", name: "[-5, -4.01]", from: -5, to: -4.01 },
              { color: "#D6604D", name: "[-4, -3.01]", from: -4, to: -3.01 },
              { color: "#F4A582", name: "[-3, -2.01]", from: -3, to: -2.01 },
              { color: "#FDDBC7", name: "[-2, -1.01]", from: -2, to: -1.01 },
              { color: "#CCCCCC", name: "[-1, 0.99]", from: -1, to: 0.99 },
              { color: "#D1E5F0", name: "[1, 1.99]", from: 1, to: 1.99 },
              { color: "#92C5DE", name: "[2, 2.99]", from: 2, to: 2.99 },
              { color: "#4393C3", name: "[3, 3.99]", from: 3, to: 3.99 },
              { color: "#2166AC", name: "[4, 4.99]", from: 4, to: 4.99 },
              { color: "#053061", name: "5 >", from: 5, to: Number.MAX_SAFE_INTEGER },
            ],
          },
        },
      },
    };
  }, [alignAt, chartType, showDataLabels, title, isCumulative, metric]);

  if (chartLoading) {
    return (
      <div style={{ height: props.height, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Dimmer active inverted>
          <Loader active inline content="This may take a few minutes..." />
        </Dimmer>
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
    <React.Fragment>
      <ReactApexChart key={chartType + "_1"} ref={ref} options={chartOptions} series={sortedSeries.slice(-1)} type={chartType} height={150} width={rest.width} />
      <ReactApexChart
        key={chartType + "_2"}
        ref={ref}
        options={{
          ...chartOptions,
          grid: {
            padding: {
              left: sortedSeries.slice(-1)[0].name.length * 5,
              bottom: 20,
            },
          },
          yaxis: {
            labels: {
              offsetX: sortedSeries.slice(-1)[0].name.length * 4,
            },
          },
        }}
        series={sortedSeries.slice(0, -1)}
        type={chartType}
        height={Math.max(Number(rest.height), (chartType === "heatmap" ? 30 : 0) * sortedSeries.length)}
        width={rest.width}
      />
    </React.Fragment>
  );
}

export default React.forwardRef(ValidationChart);

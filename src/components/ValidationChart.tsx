import * as d3 from "d3";
import { format } from "date-fns";
import numeral from "numeral";
import React, { useMemo } from "react";
import ReactApexChart, { Props } from "react-apexcharts";
import { Dimmer, Loader } from "semantic-ui-react";
import useMetadata from "../hooks/useMetadata";
import useRegionData from "../hooks/useRegionData";
import { getByRegionId } from "../utils/metadata";
import { alignTimeseries } from "../utils/normalizeTimeseries";
import { ChartOptions } from "./Editor";
import { isNumber, first } from "lodash";
import { titleCase } from "../utils/string";
import { PREDICTIONS_API } from "../constants";
import { useQuery } from "react-query";

const displayNumberFormatter = d3.format(",.2~f");
const increaseNumberFormatter = d3.format("+.1~f");
const ordinalFormattter = (n: number) => numeral(n).format("Oo");
const numberFormatter = d3.format(".2~s");
const predErrorFormatter = d3.format("+");

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

  const predictionsErrorQuery = useQuery(["predictionsError", filteredSeries, metric], async () => {
    const selectedSerie = filteredSeries[0];
    const baseIndex = 30;
    const res = await fetch(`${PREDICTIONS_API}/api/v1/predictions/${metric}/errors`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: selectedSerie.data.filter((d) => d.cases > 0),
        thresholds: [1, 5, 10, 20, 30],
        base_index: baseIndex,
      }),
    });
    const json = await res.json();
    const dataSinceFirstCase = selectedSerie.data.filter((d_1) => d_1.cases > 0).slice(-50);
    const serieData = alignTimeseries(dataSinceFirstCase, first(dataSinceFirstCase)!.date);
    const seriesWithErrors = [
      {
        ...selectedSerie,
        data: serieData
          .map((row: any) => ({
            x: row.date.getTime(),
            y: 0,
            isPrediction: row.is_prediction || false,
            rawValue: row[metric],
          }))
          .slice(-baseIndex),
      },
    ].concat(
      json.series.map((errorSerie: any) => {
        return {
          name: `${errorSerie.threshold}d`,
          key: `${errorSerie.threshold}d`,
          data: errorSerie.data.map((row_1: any) => ({
            y: row_1.y,
            x: new Date(row_1.x).getTime(),
            isPrediction: row_1.is_prediction,
            rawValue: row_1.pred_value,
            rawError: row_1.raw_error,
          })),
        };
      })
    );
    return seriesWithErrors;
  });

  const seriesWithErrors = predictionsErrorQuery.data || [];

  const sortedSeries = useMemo(() => {
    return [...seriesWithErrors].reverse();
  }, [seriesWithErrors]);

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
              { color: "#67001F", name: "< -5", from: Number.MIN_SAFE_INTEGER, to: -5 },
              { color: "#B2182B", name: "[-5, -4.01]", from: -5, to: -4 },
              { color: "#D6604D", name: "[-4, -3.01]", from: -4, to: -3 },
              { color: "#F4A582", name: "[-3, -2.01]", from: -3, to: -2 },
              { color: "#FDDBC7", name: "[-2, -1.01]", from: -2, to: -1 },
              { color: "#CCCCCC", name: "[-1, 0.99]", from: -1, to: 1 },
              { color: "#D1E5F0", name: "[1, 1.99]", from: 1, to: 2 },
              { color: "#92C5DE", name: "[2, 2.99]", from: 2, to: 3 },
              { color: "#4393C3", name: "[3, 3.99]", from: 3, to: 4 },
              { color: "#2166AC", name: "[4, 4.99]", from: 4, to: 5 },
              { color: "#053061", name: "5 >", from: 5, to: Number.MAX_SAFE_INTEGER },
            ],
          },
        },
      },
    };
  }, [alignAt, chartType, showDataLabels, title, isCumulative, metric]);

  if (predictionsErrorQuery.isFetching) {
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

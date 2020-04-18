import * as d3 from "d3";
import { startOfDay, subDays } from "date-fns";
import get from "lodash/get";
import sortBy from "lodash/sortBy";
import React, { useMemo } from "react";
import ReactApexChart, { Props } from "react-apexcharts";
import { Loader } from "semantic-ui-react";
import useMetadata from "../hooks/useMetadata";
import useRegionData from "../hooks/useRegionData";
import useSeriesColors from "../hooks/useSeriesColors";
import { getNameByRegionId } from "../utils/metadata";
import { alignTimeseries } from "../utils/normalizeTimeseries";
import { ChartOptions } from "./Editor";
import TSNE from "tsne-js";
import { UMAP } from "umap-js";

const numberFormatter = d3.format(".2s");

type ProjectionsChartProps = Omit<Props, "options" | "series" | "type"> & ChartOptions;

function ProjectionsChart(props: ProjectionsChartProps, ref: React.Ref<any>) {
  const {
    title,
    metric,
    showDataLabels,
    isCumulative,
    dayInterval,
    selectedRegions,
    alignAt = 0,
    epsilon,
    iterations,
    perplexity,
    timeserieSlice,
    projectionType,
    spread,
    minDist,
    neighbors,
    ...rest
  } = props;

  const regionsIds = useMemo(() => Object.keys(selectedRegions), [selectedRegions]);

  const { data, loading, error } = useRegionData(regionsIds);
  const { data: metadata } = useMetadata();

  const series = useMemo(() => {
    if (loading || !data) {
      return [];
    }

    const earliestDate = subDays(startOfDay(new Date()), dayInterval);
    return Object.entries(data).map(([region, regionData]) => {
      const name = getNameByRegionId(metadata, region);

      if (alignAt > 0) {
        return {
          name,
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
        name,
        key: region,
        data: alignTimeseries(regionData, earliestDate).map((row) => ({
          x: row.date.getTime(),
          y: row[`${metric}${isCumulative ? "" : "_daily"}` as "cases" | "deaths" | "cases_daily" | "deaths_daily"],
        })),
      };
    });
  }, [loading, data, dayInterval, alignAt, metric, isCumulative, metadata]);

  const sortedSeries = useMemo(() => {
    return sortBy(
      series.filter((s) => !!selectedRegions[s.key]),
      (s) => get(s.data, [s.data.length - 1, "y"])
    );
  }, [series, selectedRegions]);

  const seriesColors = useSeriesColors(sortedSeries);

  const tsneSeries = useMemo(() => {
    const validSeries = sortedSeries.filter((serie) => serie.data.length >= timeserieSlice);

    const tsneData = validSeries.map((serie) => {
      const data = serie.data.slice(0, timeserieSlice).map((cord) => cord.y);
      return data;
    });

    if (tsneData.length === 0) {
      return [];
    }

    let projectionOutput: any = [];

    switch (projectionType) {
      case "tsne":
        const model = new TSNE({
          dim: 2,
          earlyExaggeration: 4.0,
          perplexity: perplexity,
          learningRate: epsilon,
          nIter: iterations,
          metric: "euclidean",
        });
        model.init({
          data: tsneData,
          type: "dense",
        });
        model.run();

        projectionOutput = model.getOutput();
        break;
      case "umap":
        const umap = new UMAP({
          nComponents: 2,
          nNeighbors: neighbors,
          spread: spread,
          minDist: minDist,
        });
        const embedding = umap.fit(tsneData);

        projectionOutput = embedding;
        break;
    }

    return validSeries.map((serie, index) => {
      return {
        ...serie,
        data: [
          {
            x: projectionOutput[index][0],
            y: projectionOutput[index][1],
          },
        ],
      };
    });
  }, [epsilon, iterations, minDist, neighbors, perplexity, projectionType, sortedSeries, spread, timeserieSlice]);

  const chartOptions = useMemo(() => {
    return {
      chart: {
        animations: {
          animateGradually: { enabled: false },
        },
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
      xaxis: {
        labels: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          show: false,
        },
      },
      colors: seriesColors,
      tooltip: {
        y: {
          formatter: (value: number) => value,
        },
        x: {
          formatter: (value: number) => value,
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
    };
  }, [title, metric, isCumulative, showDataLabels, seriesColors]);

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

  return <ReactApexChart key="scatter" ref={ref} options={chartOptions} series={tsneSeries} type="scatter" {...rest} />;
}

export default React.forwardRef(ProjectionsChart);

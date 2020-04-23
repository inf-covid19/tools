import * as d3 from "d3";
import { format } from "date-fns";
import first from "lodash/first";
import last from "lodash/last";
import sortBy from "lodash/sortBy";
import React, { useMemo } from "react";
import ReactApexChart, { Props } from "react-apexcharts";
import { Loader } from "semantic-ui-react";
import TSNE from "tsne-js";
import { UMAP } from "umap-js";
import useMetadata from "../hooks/useMetadata";
import useRegionData from "../hooks/useRegionData";
import useSeriesColors from "../hooks/useSeriesColors";
import { median } from "../utils/math";
import { getNameByRegionId } from "../utils/metadata";
import { ChartOptions } from "./Editor";
import { getSammonStress } from "../utils/sammonStress";

const numberFormatter = d3.format(".2s");

type ProjectionsChartProps = Omit<Props, "options" | "series" | "type"> & ChartOptions;

function ProjectionsChart(props: ProjectionsChartProps, ref: React.Ref<any>) {
  const {
    title,
    metric,
    showDataLabels,
    isCumulative,
    selectedRegions,
    alignAt,
    epsilon,
    iterations,
    perplexity,
    timeserieSlice,
    projectionType,
    spread,
    minDist,
    neighbors,
    chartType,
    ...rest
  } = props;

  const regionsIds = useMemo(() => Object.keys(selectedRegions), [selectedRegions]);

  const { data, loading, error } = useRegionData(regionsIds);
  const { data: metadata } = useMetadata();

  const series = useMemo(() => {
    if (loading || !data) {
      return [];
    }

    return Object.entries(data).flatMap(([region, regionData]) => {
      const name = getNameByRegionId(metadata, region);
      const regionDataWithValues = regionData.filter((v) => v[metric] > 0);

      if (regionDataWithValues.length === 0) {
        return [];
      }

      const startDate = first(regionDataWithValues)?.date;
      const endDate = last(regionDataWithValues)?.date;
      const total = last(regionDataWithValues)?.[metric];
      const avg = median(regionDataWithValues.map((v) => v[`${metric}_daily` as "cases_daily" | "deaths_daily"]));

      return [
        {
          name,
          key: region,
          startDate,
          endDate,
          total,
          avg,
          data: regionData
            .filter((v) => v[metric] >= alignAt)
            .map((v, index) => ({
              x: index + 1,
              y: isCumulative ? v[metric] : v[`${metric}_daily` as "cases_daily" | "deaths_daily"],
            })),
        },
      ];
    });
  }, [loading, data, metadata, metric, alignAt, isCumulative]);

  const sortedSeries = useMemo(() => {
    return sortBy(series, "name");
  }, [series]);

  const [projectionSeries, sammonStress] = useMemo(() => {
    const validSeries = sortedSeries.filter((serie) => serie.data.length >= (timeserieSlice || 0));

    const projectionData = validSeries.map((serie) => {
      const data = serie.data.slice(0, timeserieSlice).map((cord) => cord.y);
      return data;
    });

    if (projectionData.length === 0) {
      return [[], 0];
    }

    let projectionOutput: any = [];

    switch (projectionType) {
      case "tsne": {
        const model = new TSNE({
          dim: 2,
          earlyExaggeration: 4.0,
          perplexity: perplexity,
          learningRate: epsilon,
          nIter: iterations,
          metric: "euclidean",
        });
        model.init({
          data: projectionData,
          type: "dense",
        });
        console.log("run", model.run());

        projectionOutput = model.getOutput();
        break;
      }
      case "umap": {
        if (projectionData.length <= neighbors) {
          return [[], 0];
        }

        const umap = new UMAP({
          nComponents: 2,
          nNeighbors: neighbors,
          spread: spread,
          minDist: minDist,
        });
        const embedding = umap.fit(projectionData);

        projectionOutput = embedding;
        break;
      }
    }

    return [
      validSeries.map((serie, index) => {
        return {
          ...serie,
          data: [
            {
              x: projectionOutput[index][0],
              y: projectionOutput[index][1],
            },
          ],
        };
      }),
      getSammonStress(projectionData, projectionOutput),
    ];
  }, [epsilon, iterations, minDist, neighbors, perplexity, projectionType, sortedSeries, spread, timeserieSlice]);

  const seriesColors = useSeriesColors(projectionSeries);

  const chartOptions = useMemo(() => {
    return {
      chart: {
        zoom: {
          enabled: true,
          type: "xy",
        },
        animations: {
          animateGradually: { enabled: false },
        },
        toolbar: {
          tools: {
            download: true,
            selection: false,
            pan: false,
            zoom: true,
            zoomin: true,
            zoomout: true,
            reset: true,
          },
        },
      },
      xaxis: {
        type: "numeric",
        labels: {
          show: false,
        },
        tooltip: {
          enabled: false,
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
          formatter: (_: number, point: any) => {
            const seriesData = point?.w?.config?.series[point.seriesIndex];
            return seriesData?.total >= 0 ? `${seriesData.total} ${metric}` : "-";
          },
        },
        x: {
          formatter: (_: number, point: any) => {
            const seriesData = point?.w?.config?.series[point.seriesIndex];

            if (seriesData?.startDate && seriesData?.endDate) {
              return `From ${format(new Date(seriesData.startDate), "PPP")} to ${format(new Date(seriesData.endDate), "PPP")}`;
            }

            if (seriesData?.startDate) {
              return `Since ${format(new Date(seriesData.startDate), "PPP")}`;
            }

            if (seriesData?.endDate) {
              return `Until ${format(new Date(seriesData.endDate), "PPP")}`;
            }

            return `No eligible data`;
          },
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
        text: `Projection based on the ${isCumulative ? "total" : "daily"} number of ${metric} | Sammon’s stress: ${sammonStress}`,
        floating: true,
        style: {
          fontSize: "14px",
          fontFamily: "Lato, 'Helvetica Neue', Arial, Helvetica, sans-serif",
        },
      },
      markers: {
        strokeWidth: 1,
        strokeColors: "#909090",
        hover: {
          sizeOffset: 5,
        },
      },
      grid: {
        strokeDashArray: 7,
        xaxis: {
          lines: {
            show: true,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
      },
    };
  }, [seriesColors, showDataLabels, title, isCumulative, metric, sammonStress]);

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

  return <ReactApexChart ref={ref} options={chartOptions} series={projectionSeries} type="scatter" {...rest} />;
}

export default React.forwardRef(ProjectionsChart);

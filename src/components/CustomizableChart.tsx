import React, { useMemo } from "react";
import useRegionData from "../hooks/useRegionData";
import { eachDayOfInterval, subDays, format, startOfDay, parse, differenceInDays } from "date-fns";
import sortBy from "lodash/sortBy";
import orderBy from "lodash/orderBy";
import findLastIndex from "lodash/findLastIndex";
import get from 'lodash/get';
import last from "lodash/last";
import first from "lodash/first";
import ReactApexChart, { Props } from "react-apexcharts";
import { Loader } from "semantic-ui-react";
import { ChartOptions } from "./Editor";
import numeral from "numeral";
import * as d3 from "d3";

const ordinalFormattter = (n: number) => numeral(n).format("Oo");
const numberFormatter = d3.format(".2s");

type CustomizableChartProps = Omit<Props, "options" | "series" | "type"> & ChartOptions;

const placeTypeMap: any = {
  state: "state",
  city: "city",
  autonomous_community: "region",
  country: "region",
  county: "county",
  nhsr: "region",
  utla: "region",
  health_board: "region",
  lgd: "region",
};

const RegionConfig: any = {
  Brazil: {
    date: {
      name: "date",
      format: "yyyy-MM-dd",
    },
    metric: {
      cases: "confirmed",
      deaths: "deaths",
    },
  },
  Spain: {
    date: {
      name: "date",
      format: "yyyy-MM-dd",
    },
    metric: {
      cases: "cases",
      deaths: "deaths",
    },
  },
  United_Kingdom: {
    date: {
      name: "date",
      format: "yyyy-MM-dd",
    },
    metric: {
      cases: "cases",
      deaths: "deaths",
    },
  },
  United_States_of_America: {
    date: {
      name: "date",
      format: "yyyy-MM-dd",
    },
    metric: {
      cases: "cases",
      deaths: "deaths",
    },
  },
  Sweden: {
    date: {
      name: "date",
      format: "yyyy-MM-dd",
    },
    metric: {
      cases: "cases",
      deaths: "deaths",
    },
  },
  Default: {
    date: {
      name: "dateRep",
      format: "dd/MM/yyyy",
    },
    metric: {
      cases: "cases",
      deaths: "deaths",
    },
  },
};

function CustomizableChart(props: CustomizableChartProps, ref: React.Ref<any>) {
  const { chartType = "heatmap", title, metric, showDataLabels, isCumulative, dayInterval, selectedRegions, alignAt = 0, ...rest } = props;

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
      const country = first(region.split(".")) as any;
      const hasSubRegion = region.indexOf(".") > -1;
      const config = hasSubRegion && RegionConfig.hasOwnProperty(country) ? RegionConfig[country] : RegionConfig.Default;

      if (hasSubRegion) {
        let subRegion = last(region.split("."));
        regionData = regionData.filter((r: any) => r[placeTypeMap[r.place_type]] === subRegion) as any;
      }

      regionData = orderBy(regionData, x => parse(x[config.date.name] as string, config.date.format, startOfDay(new Date())), "desc") as any;

      let cumulativeValue = 0;
      if (alignAt > 0) {
        let prevDate: Date;

        const normalizedData = regionData.reduceRight<any[]>((arr, curr) => {
          let date = parse(curr[config.date.name] as string, config.date.format, startOfDay(new Date()));
          const value = parseInt(curr[config.metric[metric]] || "0");
          let diffValue = value;

          if (hasSubRegion) {
            diffValue = value - cumulativeValue;
          }

          if (prevDate && differenceInDays(date, prevDate) > 1) {
            const missingInterval = eachDayOfInterval({
              start: prevDate,
              end: date,
            });
            missingInterval.slice(1, missingInterval.length - 1).forEach(() => {
              arr.push({
                total: cumulativeValue,
              });
            });
          }

          cumulativeValue += diffValue;
          arr.push({
            ...curr,
            total: cumulativeValue,
          });
          prevDate = date;
          return arr;
        }, []);
        return {
          name: last(region.split("."))?.replace(/_/g, " "),
          key: region,
          data: normalizedData
            .filter(v => v.total >= alignAt)
            .map((v, index) => ({
              x: index + 1,
              y: isCumulative ? v.total : v[metric],
            })),
        };
      }

      const regionDataByDate = regionData.reduceRight<Record<string, any>>((acc, curr) => {
        const value = parseInt(curr[config.metric[metric]] || "0");
        const date = curr[config.date.name] as string;
        let diffValue = value;

        if (diffValue === 0 && cumulativeValue !== 0) {
          return acc;
        }

        if (hasSubRegion) {
          if (value - cumulativeValue === 0) {
            return acc;
          }
          diffValue = value - cumulativeValue;
        }
        cumulativeValue += diffValue;

        acc[date] = {
          ...curr,
          [metric]: isCumulative ? cumulativeValue : diffValue,
        };
        return acc;
      }, {});

      let prevValue = 0;
      const regionSeries = timeline.map(date => {
        const dateData = regionDataByDate[format(date, config.date.format)];
        const value = {
          x: date.getTime(),
          y: dateData ? dateData[metric] : isCumulative ? prevValue : 0,
        };
        prevValue = value.y;
        return value;
      });

      return {
        name: last(region.split("."))?.replace(/_/g, " "),
        key: region,
        data: regionSeries,
      };
    });
  }, [data, loading, timeline, isCumulative, metric, alignAt]);

  const sortedSeries = useMemo(() => {
    let desiredIndex = 0;
    const filteredSeries = series.filter(s => !!selectedRegions[s.key]);
    filteredSeries.forEach(series => {
      desiredIndex = Math.max(desiredIndex, findLastIndex(series.data, s => !!s.y))
    })
    return sortBy(filteredSeries, (s) => get(s.data, [alignAt > 0 ? s.data.length - 1 : desiredIndex, 'y']));
  }, [series, alignAt, selectedRegions]);

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
      tooltip: {
        y: {
          formatter: (value: string) => `${value} ${metric}`,
        },
        x: {
          formatter: alignAt > 0 ? (value: number) => `${ordinalFormattter(value)} day after ${alignAt >= 1000 ? numberFormatter(alignAt) : alignAt} ${metric}` : undefined,
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
  }, [title, metric, isCumulative, showDataLabels, alignAt]);

  if (loading) {
    return (
      <div style={{ height: props.height, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Loader active inline />
      </div>
    );
  }

  return <ReactApexChart key={chartType} ref={ref} options={chartOptions} series={sortedSeries} type={chartType} {...rest} />;
}

export default React.forwardRef(CustomizableChart);

import * as d3 from "d3";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import more from "highcharts/highcharts-more";
import annotations from "highcharts/modules/annotations";
import xrange from "highcharts/modules/xrange";
import { get } from "lodash";
import React, { useMemo } from "react";


more(Highcharts);
xrange(Highcharts);
annotations(Highcharts);

const DEFAULT_RESTRICTION = "stay_home_restrictions";
const colorSchema = d3.interpolateYlOrRd;

function getRestrictionPoints(records, { restriction = DEFAULT_RESTRICTION } = {}) {
  const points = [];

  let previousValue = 0;
  records.forEach((x) => {
    const value = x[restriction];
    if (Math.abs(value) !== Math.abs(previousValue)) {
      points.push({ ...x, previousValue });
      previousValue = value;
    }
  });

  return points;
}

function LocationChart({ records, featuredConfirmedPeriods, featuredDeathsPeriods, location, covidVariants }) {
  const chartOptions = useMemo(() => {
    const recordByDate = records.reduce((mapping, x) => {
      mapping[new Date(x.date).toISOString().slice(0, 10)] = x;
      return mapping;
    }, {});

    const restrictionsPoints = getRestrictionPoints(records);

    console.log("--restrictionsPoints--", { restrictionsPoints });

    return {
      ...baseOptions,
      annotations: [
        {
          shapes: restrictionsPoints.map((x) => ({
            point: {
              xAxis: 0,
              yAxis: 0,
              x: new Date(x.date).getTime(),
              y: x.confirmed_by_100k_daily_7d,
            },
            type: "circle",
            r: 10,
            fill: {
              linearGradient: { x1: 0, x2: 1, y1: 0, y2: 0 },
              stops: [
                [0, colorSchema(Math.abs(x.previousValue) / 3)], // start
                [0.49, colorSchema(Math.abs(x.previousValue) / 3)], // start
                [0.51, colorSchema(Math.abs(x[DEFAULT_RESTRICTION]) / 3)],
                [1, colorSchema(Math.abs(x[DEFAULT_RESTRICTION]) / 3)], // end
              ],
            },
          })),
        },
        {
          draggable: "",
          labelOptions: {
            shape: "connector",
            align: "right",
            justify: false,
            crop: true,
            style: {
              fontSize: "0.8em",
              textOutline: "1px white",
            },
          },
          labels: Object.entries(get(covidVariants, location.country, {})).map(([label, date]) => {
            return {
              point: { xAxis: 0, yAxis: 0, x: new Date(recordByDate[date].date).getTime(), y: recordByDate[date].confirmed_by_100k_daily_7d },
              text: `${label} detected`,
            };
          }),
        },
      ],
      series: [
        {
          name: "Confirmed Cases",
          type: "spline",
          data: records.map((x) => ({
            x: new Date(x.date).getTime(),
            y: x.confirmed_by_100k_daily_7d,
            total: x.confirmed,
            daily: x.confirmed_daily_7d,
          })),
          tooltip: {
            pointFormat:
              "{series.name}: <br/>\tTotal: <b>{point.total}</b><br/>\t7-day moving average: <b>{point.daily}</b><br/>\tPer 100k inhabitants: <b>{point.y}</b><br/><br/>",
          },
        },
        {
          name: "Confirmed Deaths",
          type: "spline",
          dashStyle: "shortdot",
          yAxis: 1,
          color: "#DEB6AB",
          data: records.map((x) => ({
            x: new Date(x.date).getTime(),
            y: x.deaths_by_100k_daily_7d,
            total: x.deaths,
            daily: x.deaths_daily_7d,
          })),
          tooltip: {
            pointFormat:
              "{series.name}: <br/>\tTotal: <b>{point.total}</b><br/>\t7-day moving average: <b>{point.daily}</b><br/>\tPer 100k inhabitants: <b>{point.y}</b><br/><br/>",
          },
        },
      ],
    };
  }, [records, location, covidVariants]);

  return (
    <div>
      <HighchartsReact highcharts={Highcharts} options={chartOptions} />
    </div>
  );
}

export default LocationChart;

const baseOptions = {
  chart: {
    zoomType: "xy",
  },
  title: {
    text: null,
  },
  xAxis: [
    {
      type: "datetime",
      crosshair: true,
    },
  ],
  yAxis: [
    {
      // Primary yAxis
      labels: {
        // format: "{value}°C",
        // style: {
        //   color: Highcharts.getOptions().colors[2],
        // },
      },
      title: {
        text: "Daily Confirmed Cases (per 100k inhabitants)",
        // style: {
        //   color: Highcharts.getOptions().colors[2],
        // },
      },
    },
    {
      // Secondary yAxis
      //   gridLineWidth: 0,
      title: {
        text: "Daily Confirmed Deaths (per 100k inhabitants)",
        // style: {
        //   color: Highcharts.getOptions().colors[0],
        // },
      },
      labels: {
        // format: "{value} mm",
        // style: {
        //   color: Highcharts.getOptions().colors[0],
        // },
      },
      opposite: true,
    },
  ],
  tooltip: {
    shared: true,
  },
  legend: {
    layout: "vertical",
    align: "left",
    x: 80,
    verticalAlign: "top",
    y: 25,
    floating: true,
    backgroundColor:
      Highcharts.defaultOptions.legend.backgroundColor || // theme
      "rgba(255,255,255,0.25)",
  },
  credits: {
    enabled: false,
  },
};

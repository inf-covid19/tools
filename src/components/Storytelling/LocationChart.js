import * as d3 from "d3";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import more from "highcharts/highcharts-more";
import annotations from "highcharts/modules/annotations";
import xrange from "highcharts/modules/xrange";
import { get, merge } from "lodash";
import React, { useMemo } from "react";

import { getRestrictionPoints, getVacinationMilestones } from "./utils/functions";
import Legend from "./Legend";

more(Highcharts);
xrange(Highcharts);
annotations(Highcharts);

const colorSchema = d3.interpolateYlOrRd;

function LocationChart({ records, featuredConfirmedPeriods, featuredDeathsPeriods, location, covidVariants }) {
  const chartOptions = useMemo(() => {
    const recordByDate = records.reduce((mapping, x) => {
      mapping[new Date(x.date).toISOString().slice(0, 10)] = x;
      return mapping;
    }, {});
    const stay_home_restrictions_points = getRestrictionPoints(records, { restriction: "stay_home_restrictions" });
    const workplace_closing_points = getRestrictionPoints(records, { restriction: "workplace_closing" });
    const school_closing_points = getRestrictionPoints(records, { restriction: "school_closing" });

    const vacinationMilestones = getVacinationMilestones(records);

    const mapPoints = (restrictionsPoints, restriction, extra = {}, { getColor = colorSchema } = {}) => {
      return restrictionsPoints.map((x) =>
        merge(
          {
            point: {
              xAxis: 0,
              yAxis: 0,
              x: new Date(x.date).getTime(),
              y: x.confirmed_by_100k_daily_7d,
            },
            type: "circle",
            r: 5,
            fill: {
              linearGradient: { x1: 0, x2: 1, y1: 0, y2: 0 },
              stops: [
                [0, getColor(Math.abs(x.previousValue) / 3)], // start
                [0.49, getColor(Math.abs(x.previousValue) / 3)], // start
                [0.51, getColor(Math.abs(x[restriction]) / 3)],
                [1, getColor(Math.abs(x[restriction]) / 3)], // end
              ],
            },
          },
          extra
        )
      );
    };

    return merge(baseOptions, {
      xAxis: {
        plotLines: featuredConfirmedPeriods.featured_periods.map(({ start, end }, index, arr) => {
          return {
            label: {
              text: `Wave #${index + 1} started`,
            },
            color: d3.interpolateWarm((index + 1) / arr.length),
            width: 2,
            value: start,
            zIndex: 6,
          };
        }),
      },
      annotations: [
        {
          draggable: "",
          shapes: mapPoints(stay_home_restrictions_points, "stay_home_restrictions", {}, { getColor: d3.interpolateBuPu }),
        },
        {
          draggable: "",
          shapes: mapPoints(workplace_closing_points, "workplace_closing", { type: "rect", width: 10, height: 10 }, { getColor: d3.interpolateOrRd }),
        },
        {
          draggable: "",
          shapes: mapPoints(school_closing_points, "school_closing", {}, { getColor: d3.interpolateYlGn }),
        },
        {
          draggable: "",
          labelOptions: {
            shape: "connector",
            align: "right",
            y: -40,
            justify: false,
            crop: true,
            style: {
              fontSize: "0.8em",
              textOutline: "1px white",
            },
          },
          labels: Object.entries(get(covidVariants, location.isCountry ? location.name : location.country, {})).map(([label, date]) => {
            return {
              point: { xAxis: 0, yAxis: 0, x: new Date(recordByDate[date].date).getTime(), y: recordByDate[date].confirmed_by_100k_daily_7d },
              text: `${label} detected`,
            };
          }),
        },
        {
          draggable: "",
          labels: vacinationMilestones.map(({ date: rawDate, label }) => {
            const date = new Date(rawDate).toISOString().slice(0, 10);

            return {
              allowOverlap: true,
              point: { xAxis: 0, yAxis: 0, x: new Date(recordByDate[date].date).getTime(), y: recordByDate[date].confirmed_by_100k_daily_7d },
              text: label,
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
            per100k: x.confirmed_by_100k,
          })),
          tooltip: {
            pointFormat:
              "{series.name}: <br/>\tTotal: <b>{point.total}</b><br/>\t7-day moving average: <b>{point.daily}</b><br/>\tPer 100k inhabitants: <b>{point.per100k}</b><br/><br/>",
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
            per100k: x.deaths_by_100k,
            daily: x.deaths_daily_7d,
          })),
          tooltip: {
            pointFormat:
              "{series.name}: <br/>\tTotal: <b>{point.total}</b><br/>\t7-day moving average: <b>{point.daily}</b><br/>\tPer 100k inhabitants: <b>{point.per100k}</b><br/><br/>",
          },
        },
      ],
    });
  }, [records, featuredConfirmedPeriods, covidVariants, location]);

  return (
    <div>
      <HighchartsReact highcharts={Highcharts} options={chartOptions} />

      <Legend
        legends={[
          {
            title: "Stay Home Restrictions",
            possibleValues: [0, 1, 2, 3],
            colorSchema: d3.interpolateBuPu,
          },
          {
            title: "Workplace Closing",
            possibleValues: [0, 1, 2, 3],
            colorSchema: d3.interpolateOrRd,
          },
          {
            title: "School Closing",
            possibleValues: [0, 1, 2, 3],
            colorSchema: d3.interpolateYlGn,
          },
        ]}
      />
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
  xAxis: {
    type: "datetime",
    crosshair: true,
  },
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
    x: 100,
    verticalAlign: "top",
    y: 15,
    floating: true,
    backgroundColor:
      Highcharts.defaultOptions.legend.backgroundColor || // theme
      "rgba(255,255,255,0.25)",
  },
  credits: {
    enabled: false,
  },
};

import * as d3 from "d3";
import HighchartsReact from "highcharts-react-official";
import { get, merge, startCase } from "lodash";
import React, { useMemo } from "react";
import Highcharts from "../../utils/highcharts";
import { getUnifiedRestrictionPoints, getVacinationMilestones } from "./utils/functions";

const colorSchema = d3.interpolateYlOrRd;

const mapPoints = (restrictionsPoints, restriction, extra = {}, { getColor = colorSchema, yAttribute, maxValue = 9 } = {}) => {
  return restrictionsPoints.map((x) =>
    merge(
      {
        point: {
          xAxis: 0,
          yAxis: 0,
          x: new Date(x.date).getTime(),
          y: x[yAttribute],
        },
        type: "circle",
        r: 5,
        fill: {
          linearGradient: { x1: 0, x2: 1, y1: 0, y2: 0 },
          stops: [
            [0, getColor(Math.abs(x.previousValue) / maxValue)], // start
            [0.49, getColor(Math.abs(x.previousValue) / maxValue)], // start
            [0.5, getColor(Math.abs(x[restriction]) / maxValue)],
            [1, getColor(Math.abs(x[restriction]) / maxValue)], // end
          ],
        },
      },
      extra
    )
  );
};

function LocationChart({ records, featuredConfirmedPeriods, featuredDeathsPeriods, location, covidVariants, attribute }) {
  const attrY = `${attribute}_by_100k_daily_7d`;
  const attrTotal = attribute;
  const attrMovingAvg = `${attribute}_daily_7d`;
  const attrPer100k = `${attribute}_by_100k`;

  const featuredPeriods = attribute === "confirmed" ? featuredConfirmedPeriods : featuredDeathsPeriods;

  const chartOptions = useMemo(() => {
    const recordByDate = records.reduce((mapping, x) => {
      mapping[new Date(x.date).toISOString().slice(0, 10)] = x;
      return mapping;
    }, {});

    const vacinationMilestones = getVacinationMilestones(records);

    const unifiedRestrictionPoints = getUnifiedRestrictionPoints(records);

    return merge({}, baseOptions, {
      chart: {
        marginLeft: 150,
      },
      xAxis: {
        plotLines: featuredPeriods.featured_periods.map(({ start, end }, index, arr) => {
          return {
            color: d3.schemePaired[(index + 1) % 2],
            width: 2,
            value: start,
            zIndex: 6,
          };
        }),
        plotBands: featuredPeriods.featured_periods.map(({ start, end }, index, arr) => {
          return {
            label: {
              text: `Wave #${index + 1}`,
            },
            color: {
              linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
              stops: [
                [0, d3.schemePaired[(index + 1) % 2]], // start
                [0.069, d3.schemePaired[(index + 1) % 2]], // start
                [0.07, "rgba(0,0,0,0)"], // middle
                [1, "rgba(0,0,0,0)"], // end
              ],
            },
            from: start,
            to: end,
            // zIndex: 6,
          };
        }),
      },
      yAxis: {
        title: {
          text: attribute === "confirmed" ? "Confirmed Cases per 100k inhab.<br>(7-day moving average)" : `${startCase(attribute)} per 100k inhab.<br>(7-day moving average)`,
        },
      },
      annotations: [
        {
          draggable: "",
          shapes: mapPoints(unifiedRestrictionPoints, "unified_restriction", {}, { yAttribute: attrY }),
        },
        // {
        //   draggable: "",
        //   shapes: mapPoints(workplace_closing_points, "workplace_closing", { type: "rect", width: 10, height: 10 }, { getColor: d3.interpolateOrRd }),
        // },
        // {
        //   draggable: "",
        //   shapes: mapPoints(school_closing_points, "school_closing", {}, { getColor: d3.interpolateYlGn }),
        // },
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
          labels: Object.entries(get(covidVariants, location.isCountry ? location.name : location.country, {})).flatMap(([label, date]) => {
            if (label.includes(".")) {
              return [];
            }

            return {
              point: { xAxis: 0, yAxis: 0, x: new Date(recordByDate[date].date).getTime(), y: recordByDate[date][attrY] },
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
              point: { xAxis: 0, yAxis: 0, x: new Date(recordByDate[date].date).getTime(), y: recordByDate[date][attrY] },
              text: label,
            };
          }),
        },
      ],
      series: [
        {
          name: attribute === "confirmed" ? "Confirmed Cases" : startCase(attribute),
          type: "spline",
          data: records.map((x) => ({
            x: new Date(x.date).getTime(),
            y: x[attrY],
            total: x[attrTotal],
            daily: x[attrMovingAvg],
            per100k: x[attrPer100k],
          })),
          color: colorSchema(0),
          zoneAxis: "x",
          zones: unifiedRestrictionPoints.flatMap((x, index, array) => {
            const zone = {
              value: new Date(x.date).getTime(),
              color: colorSchema(x.previousValue / 9),
            };

            if (index === array.length - 1) {
              return [
                zone,
                {
                  color: colorSchema(x.unified_restriction / 9),
                },
              ];
            }

            return zone;
          }),
          tooltip: {
            pointFormat: `{series.name}: <br/>
              \tTotal: <b>{point.total:.2f}</b><br/>
              \t↪️7-day moving avg.: <b>{point.daily:.2f}</b><br/>
              <br/>
              \tTotal per 100k inhab.: <b>{point.per100k:.2f}</b><br/>
              \t↪️7-day moving avg. per 100k inhab.: <b>{point.y:.2f}</b><br/><br/>
              `,
          },
        },
        // {
        //   name: "Confirmed Deaths",
        //   type: "spline",
        //   // dashStyle: "shortdot",
        //   yAxis: 1,
        //   color: "#DEB6AB",
        //   data: records.map((x) => ({
        //     x: new Date(x.date).getTime(),
        //     y: x.deaths_by_100k_daily_7d,
        //     total: x.deaths,
        //     per100k: x.deaths_by_100k,
        //     daily: x.deaths_daily_7d,
        //   })),
        //   tooltip: {
        //     pointFormat:
        //       "{series.name}: <br/>\tTotal: <b>{point.total}</b><br/>\t7-day moving average: <b>{point.daily}</b><br/>\tPer 100k inhabitants: <b>{point.per100k}</b><br/><br/>",
        //   },
        // },
      ],
    });
  }, [records, featuredPeriods, covidVariants, location, attribute, attrY, attrTotal, attrMovingAvg, attrPer100k]);

  return (
    <div>
      <HighchartsReact key={`${location.id}:${attribute}`} highcharts={Highcharts} options={chartOptions} />
    </div>
  );
}

export default LocationChart;

const baseOptions = {
  chart: {
    zoomType: "x",
  },
  title: {
    text: null,
  },
  xAxis: {
    type: "datetime",
    crosshair: true,
  },
  yAxis: {
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
  // {
  //   // Secondary yAxis
  //   //   gridLineWidth: 0,
  //   title: {
  //     text: "Daily Confirmed Deaths (per 100k inhabitants)",
  //     // style: {
  //     //   color: Highcharts.getOptions().colors[0],
  //     // },
  //   },
  //   labels: {
  //     // format: "{value} mm",
  //     // style: {
  //     //   color: Highcharts.getOptions().colors[0],
  //     // },
  //   },
  //   opposite: true,
  // },
  tooltip: {
    shared: true,
  },
  legend: {
    enabled: false,
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

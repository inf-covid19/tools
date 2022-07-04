import * as d3 from "d3";
import { format } from "date-fns";
import HighchartsReact from "highcharts-react-official";
import { mapValues, merge, orderBy } from "lodash";
import numeral from "numeral";
import { Resizable } from "re-resizable";
import React, { useMemo, useCallback } from "react";
import useStorageState from "../../hooks/useStorageState";
import Highcharts from "../../utils/highcharts";
import { titleCase } from "../../utils/string";

const ordinalFormattter = (n) => numeral(n).format("Oo");
const formatNumber = d3.format(",.2f");

function ChartContainer({ currentLocation, attribute, byAttribute, reversed = false, locationById, dataByLocationId }) {
  const [size, setSize] = useStorageState(`similarityDebugger_chartContainerSize_${attribute}`, {
    width: "100%",
    height: 600,
  });

  const xGetter = useCallback((record) => (byAttribute === "date" ? new Date(record.date).getTime() : record[byAttribute]), [byAttribute]);
  const yGetter = useCallback((record) => record[attribute], [attribute]);

  const tooltipByX = useMemo(() => {
    const dataByX = {};

    for (let [locationId, rawData] of Object.entries(dataByLocationId)) {
      for (let record of rawData) {
        const x = xGetter(record);
        const { source } = record;

        if (x in dataByX) {
          dataByX[x].push({ x, y: yGetter(record), source, locationId });
        } else {
          dataByX[x] = [{ x, y: yGetter(record), source, locationId }];
        }
      }
    }

    return mapValues(dataByX, (points, key) => {
      let currentLocationPoint = null;
      let samePoints = [];
      let betterPoints = [];
      let worstPoints = [];

      for (const x of points) {
        if (x.locationId === currentLocation.id) {
          currentLocationPoint = x;
          continue;
        }

        if (x.y === 0) {
          samePoints.push(x);
          continue;
        }

        if (x.y > 0) {
          worstPoints.push(x);
          continue;
        }

        if (x.y < 0) {
          betterPoints.push(x);
          continue;
        }
      }

      const formatPoints = (points, sortDirection = "asc") => {
        return orderBy(points, "y", sortDirection)
          .flatMap((point) => {
            if (!point.source) return [];

            const location = locationById[point.locationId];

            return `\t${location.name}: <b>${formatNumber(point.source[attribute])} (${formatNumber(point.y)})</b>`;
          })
          .join("<br>");
      };

      return `<div>
            <b>${byAttribute === "index" ? `${ordinalFormattter(currentLocationPoint.x)} day since the first case in ${currentLocation.name}` : format(currentLocationPoint.x, "PPP")}</b>
            <br>
            🔵 Reference scenario: <br>${formatPoints([currentLocationPoint])}<br><br>
            ${samePoints.length > 0 ? `🟡 Same scenario: <br>${formatPoints(samePoints)}<br><br>` : ``}
            ${worstPoints.length > 0 ? `🔴 Worst scenario: <br>${formatPoints(worstPoints, "desc")}<br><br>` : ``}
            ${betterPoints.length > 0 ? `🟢 Better scenario: <br>${formatPoints(betterPoints)}<br><br>` : ``}
          </div>`;
    });
  }, [attribute, byAttribute, currentLocation.id, currentLocation.name, dataByLocationId, locationById, xGetter, yGetter]);

  const chartOptions = useMemo(() => {
    return merge({}, baseOptions, {
      chart: {
        height: size.height,
      },
      xAxis: {
        type: byAttribute === "date" ? "datetime" : "category",
        labels: {
          formatter:
            byAttribute === "index"
              ? function () {
                  return ordinalFormattter(this.value);
                }
              : undefined,
        },
      },
      yAxis: {
        title: {
          text: titleCase(attribute),
        },
        reversed,
        plotBands: [
          {
            from: 0,
            to: Number.POSITIVE_INFINITY,
            color: "rgba(240, 52, 52, 0.2)",
            label: {
              text: `Worst than ${currentLocation.name}`,
              align: "right",
              verticalAlign: "top",
              x: -30,
              y: 30,
              style: {
                color: "#606060",
              },
            },
          },
          {
            from: 0,
            to: Number.NEGATIVE_INFINITY,
            color: "rgba(0, 177, 106, 0.2)",
            label: {
              text: `Better than ${currentLocation.name}`,
              align: "right",
              verticalAlign: "bottom",
              x: -30,
              y: -30,
              style: {
                color: "#606060",
              },
            },
          },
        ],
      },
      tooltip: {
        formatter() {
          return tooltipByX[this.x];
        },
      },
      series: Object.entries(dataByLocationId).map(([locationId, rawData]) => {
        return {
          name: locationById[locationId].name,
          type: "spline",
          data: rawData.map((x) => {
            return {
              x: xGetter(x),
              y: yGetter(x),
              source: x.source,
            };
          }),
        };
      }),
    });
  }, [size.height, byAttribute, attribute, reversed, currentLocation.name, dataByLocationId, tooltipByX, locationById, xGetter, yGetter]);

  return (
    <Resizable
      size={size}
      minHeight={400}
      enable={{ bottom: true }}
      onResizeStop={(e, direction, ref, d) => {
        setSize({
          width: size.width + d.width,
          height: size.height + d.height,
        });
      }}
      grid={[5, 5]}
    >
      <HighchartsReact key={`${attribute}:${byAttribute}`} highcharts={Highcharts} options={chartOptions} />
    </Resizable>
  );
}

export default ChartContainer;

const baseOptions = {
  colors: d3.schemeTableau10,
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
    enabled: true,
    layout: "vertical",
    align: "right",
    // x: 100,
    verticalAlign: "top",
    // y: 15,
    // floating: true,
    backgroundColor:
      Highcharts.defaultOptions.legend.backgroundColor || // theme
      "rgba(255,255,255,0.25)",
  },
  credits: {
    enabled: false,
  },
};

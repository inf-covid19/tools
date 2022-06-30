import * as d3 from "d3";
import { format } from "date-fns";
import HighchartsReact from "highcharts-react-official";
import { merge, orderBy } from "lodash";
import numeral from "numeral";
import { Resizable } from "re-resizable";
import React, { useMemo } from "react";
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
          let currentLocationPoint = null;
          let samePoints = [];
          let betterPoints = [];
          let worstPoints = [];

          for (const x of this.points) {
            if (x.series.name === currentLocation.name) {
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

          const formatPoints = (points, sortDirection = 'asc') => {
            return orderBy(points, 'y', sortDirection)
              .flatMap(({ point }) => {
                if (!point.source) return [];

                return `\t${point.series.name}: <b>${formatNumber(point.source[attribute])} (${formatNumber(point.y)})</b>`;
              })
              .join("<br>");
          };

          return `<div>
            <b>${byAttribute === "index" ? `${ordinalFormattter(this.x)} day since the first case in ${currentLocation.name}` : format(this.x, "PPP")}</b>
            <br>
            🔵 Reference scenario: <br>${formatPoints([currentLocationPoint])}<br><br>
            ${samePoints.length > 0 ? `🟡 Same scenario: <br>${formatPoints(samePoints)}<br><br>` : ``}
            ${worstPoints.length > 0 ? `🔴 Worst scenario: <br>${formatPoints(worstPoints, 'desc')}<br><br>` : ``}
            ${betterPoints.length > 0 ? `🟢 Better scenario: <br>${formatPoints(betterPoints)}<br><br>` : ``}
          </div>`;
        },
      },
      series: Object.entries(dataByLocationId).map(([locationId, rawData]) => {
        return {
          name: locationById[locationId].name,
          type: "spline",
          data: rawData.map((x) => {
            return {
              x: byAttribute === "date" ? new Date(x.date).getTime() : x[byAttribute],
              y: x[attribute],
              source: x.source,
            };
          }),
        };
      }),
    });
  }, [size.height, byAttribute, attribute, reversed, currentLocation.name, dataByLocationId, locationById]);

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

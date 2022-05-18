import * as d3 from "d3";
import HighchartsReact from "highcharts-react-official";
import { merge, startCase } from "lodash";
import React, { useMemo } from "react";
import numeral from "numeral";
import Highcharts from "../../utils/highcharts";

const ordinalFormattter = (n) => numeral(n).format("Oo");

function ChartContainer({ attribute, byAttribute, reversed = false, locationById, dataByLocationId }) {
  const chartOptions = useMemo(() => {
    return merge({}, baseOptions, {
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
          text: startCase(attribute),
        },
        reversed,
      },
      tooltip: {
        x: {
          formatter: byAttribute === "index" ? (value) => `${ordinalFormattter(value)} day since first case` : undefined,
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
          tooltip: {
            pointFormat: `{series.name}: <b>{point.source.${attribute}:,.2f} ({point.y:.2f})</b><br/>`,
          },
        };
      }),
    });
  }, [attribute, byAttribute, dataByLocationId, locationById, reversed]);

  return (
    <div>
      <HighchartsReact key={`${attribute}:${byAttribute}`} highcharts={Highcharts} options={chartOptions} />
    </div>
  );
}

export default ChartContainer;

const baseOptions = {
  colors: d3.schemeTableau10,
  chart: {
    zoomType: "x",
    events: {
      render() {
        const chart = this;

        const yAxis = chart.yAxis[0];
        const top = yAxis.top;
        const left = yAxis.left;
        const zero = yAxis.toPixels(0);
        const height = yAxis.height;
        const width = yAxis.width;
        const lowerHeight = height - (zero - top);
        const upperHeight = height - lowerHeight;

        if (chart.myLowerRect || chart.myUpperRect) {
          chart.myLowerRect.destroy();
          chart.myUpperRect.destroy();
        }

        chart.myLowerRect = chart.renderer
          .rect(left, zero, width, lowerHeight)
          .attr({
            fill: "rgba(240, 52, 52, 0.2)",
          })
          .add();

        chart.myUpperRect = chart.renderer
          .rect(left, top, width, upperHeight)
          .attr({
            fill: "rgba(0, 177, 106, 0.2)",
          })
          .add();
      },
    },
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

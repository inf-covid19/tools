import * as d3 from "d3";
import { format } from "date-fns";
import HighchartsReact from "highcharts-react-official";
import { mapValues, merge, orderBy } from "lodash";
import numeral from "numeral";
import { Resizable } from "re-resizable";
import React, { useMemo, useCallback, useState, useRef, useEffect } from "react";
import { Header, Table } from "semantic-ui-react";
import styled from "styled-components";
import useStorageState from "../../hooks/useStorageState";
import Highcharts from "../../utils/highcharts";
import { titleCase } from "../../utils/string";

const ordinalFormattter = (n) => numeral(n).format("Oo");
const formatNumber = d3.format(",.2f");

const addColoredLines = (chart) => {
  if (chart.coloredLines) {
    chart.coloredLines.forEach(x => x.destroy());
  }

  const series = chart.series.find(x => x.options.isRef);
  const points = series.points;
  const p = 0

  const positiveLine = chart.renderer.path(['M', chart.plotLeft, chart.plotTop + chart.plotHeight, 'L', chart.plotLeft, chart.plotTop + points[p].plotY])
    .attr({
      'stroke-width': 2,
      stroke: '#38C477'
    }).add()

  const negativeLine = chart.renderer.path(['M', chart.plotLeft, points[p].plotY + chart.plotTop, 'L', chart.plotLeft, chart.plotTop])
    .attr({
      'stroke-width': 2,
      stroke: '#F2543D'
    }).add()

  chart.coloredLines = [positiveLine, negativeLine]
}

function ChartContainer({ currentLocation, attribute, byAttribute, reversed = false, locationById, dataByLocationId }) {
  const [selectedLocation, setSelectedLocation] = useState("");

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

        if (formatNumber(x.y) === formatNumber(0)) {
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

      return {
        header:
          byAttribute === "index" ? `${ordinalFormattter(currentLocationPoint.x)} day since the first case in ${currentLocation.name}` : format(currentLocationPoint.x, "PPP"),
        currentLocationPoint,
        samePoints: orderBy(samePoints, "y", "asc"),
        worstPoints: orderBy(worstPoints, "y", "desc"),
        betterPoints: orderBy(betterPoints, "y", "asc"),
      };

      // const formatPoints = (points, sortDirection = "asc") => {
      //   return orderBy(points, "y", sortDirection)
      //     .flatMap((point) => {
      //       if (!point.source) return [];

      //       const location = locationById[point.locationId];

      //       return `\t${location.name}: <b>${formatNumber(point.source[attribute])} (${formatNumber(point.y)})</b>`;
      //     })
      //     .join("<br>");
      // };

      // return `<div>
      //       <b>${

      //       }</b>
      //       <br>
      //       🔵 Reference scenario: <br>${formatPoints([currentLocationPoint])}<br><br>
      //       ${samePoints.length > 0 ? `🟡 Same scenario: <br>${formatPoints(samePoints)}<br><br>` : ``}
      //       ${worstPoints.length > 0 ? `🔴 Worst scenario: <br>${formatPoints(worstPoints, "desc")}<br><br>` : ``}
      //       ${betterPoints.length > 0 ? `🟢 Better scenario: <br>${formatPoints(betterPoints)}<br><br>` : ``}
      //     </div>`;
    });
  }, [byAttribute, currentLocation.id, currentLocation.name, dataByLocationId, xGetter, yGetter]);

  const [selectedX, setSelectedX] = useState();

  const chartOptions = useMemo(() => {
    return merge({}, baseOptions, {
      chart: {
        height: size.height,
        ignoreHiddenSeries: false,
        events: {
          load() {
            const chart = this;
            addColoredLines(chart)
          },
          redraw() {
            const chart = this;
            addColoredLines(chart)
          }
        }
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
        plotLines: [
          {
            label: { text: "" },
            value: null,
            color: "red",
          },
        ],
      },
      yAxis: {
        title: {
          text: titleCase(attribute),
        },
        reversed,
        // plotBands: [
        //   {
        //     from: 0,
        //     to: Number.POSITIVE_INFINITY,
        //     color: "rgba(240, 52, 52, 0.2)",
        //     label: {
        //       text: `Worst than ${currentLocation.name}`,
        //       align: "right",
        //       verticalAlign: "top",
        //       x: -30,
        //       y: 30,
        //       style: {
        //         color: "#606060",
        //       },
        //     },
        //   },
        //   {
        //     from: 0,
        //     to: Number.NEGATIVE_INFINITY,
        //     color: "rgba(0, 177, 106, 0.2)",
        //     label: {
        //       text: `Better than ${currentLocation.name}`,
        //       align: "right",
        //       verticalAlign: "bottom",
        //       x: -30,
        //       y: -30,
        //       style: {
        //         color: "#606060",
        //       },
        //     },
        //   },
        // ],
      },
      tooltip: {
        shared: false,
        valueDecimals: 2,

        ...(byAttribute === "index" ? { headerFormat: `<div>{point.key} days after the first case in ${currentLocation.name}</div><br/><br/>` } : {}),
        // footerFormat: '<br><br><div style="text-align: center;">Click to compare</div>',
      },
      series: Object.entries(dataByLocationId).map(([locationId, rawData]) => {
        return {
          locationId,
          name: locationById[locationId].name,
          type: "line",
          data: rawData.map((x) => [xGetter(x), yGetter(x)]),
          isRef: locationId === currentLocation.id,
        };
      }),
      plotOptions: {
        series: {
          cursor: "pointer",
          lineWidth: 2,
          marker: {
            enabled: false,
          },
          point: {
            events: {
              mouseOver() {
                if (this.series.halo) {
                  this.series.halo
                    .attr({
                      class: "highcharts-tracker",
                    })
                    .toFront();
                }
              },
              click() {
                setSelectedX((prevX) => {
                  if (prevX === this.x) {
                    this.series.chart.xAxis[0].options.plotLines[0].value = null;
                    this.series.chart.xAxis[0].options.plotLines[0].label.text = "";
                    return null;
                  }

                  this.series.chart.xAxis[0].options.plotLines[0].value = this.x;
                  this.series.chart.xAxis[0].options.plotLines[0].label.text =
                    byAttribute === "index" ? `${ordinalFormattter(this.x)} day since the first case in ${currentLocation.name}` : format(this.x, "PPP");
                  return this.x;
                });
                this.series.chart.xAxis[0].update();
              },
            },
          },
        },
      },
    });
  }, [size.height, byAttribute, attribute, reversed, currentLocation, dataByLocationId, locationById, xGetter, yGetter]);

  const renderTable = (title, points, props = {}) => {
    const hasPoints = points?.length > 0;
    if (!hasPoints) {
      return null;
    }

    return (
      <Table compact="very" selectable {...props}>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell colSpan={2}>{title}</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {points.flatMap((point) => {
            if (!point.source) {
              return [];
            }
            const location = locationById[point.locationId];

            return (
              <Table.Row
                key={point.locationId}
                active={selectedLocation === point.locationId}
                onClick={() => setSelectedLocation((curr) => (curr === point.locationId ? "" : point.locationId))}
              >
                <Table.Cell>{location.name}</Table.Cell>
                <Table.Cell>
                  <b>{`${formatNumber(point.source[attribute])} (${formatNumber(point.y)})`}</b>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    );
  };

  const renderPanelContent = () => {
    if (!selectedX) {
      return <Message>Click on the chart to see the comparison</Message>;
    }

    const { header, currentLocationPoint, samePoints, worstPoints, betterPoints } = tooltipByX[selectedX] || {};

    return (
      <>
        <Header as="h5">{header}</Header>
        {renderTable("Reference scenario", [currentLocationPoint])}
        {renderTable("Same scenario", samePoints, { color: "blue" })}
        {renderTable("Worst scenario", worstPoints, { color: "red" })}
        {renderTable("Better scenario", betterPoints, { color: "green" })}
      </>
    );
  };

  const chartRef = useRef();

  useEffect(() => {
    const chart = chartRef.current?.chart;

    if (chart) {
      chart.series.forEach((x) => {
        const { locationId, isRef } = x.options;

        const isSelected = selectedLocation ? locationId === selectedLocation : true;

        x.setVisible(isSelected || isRef, false);
      });

      chart.options.boost.seriesThreshold = selectedLocation ? 1000 : 10;

      chart.redraw();
    }
  }, [selectedLocation]);

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
      <GridContainer>
        <HighchartsReact key={`${attribute}:${byAttribute}`} ref={chartRef} highcharts={Highcharts} options={chartOptions} />
        <Panel>{renderPanelContent()}</Panel>
      </GridContainer>
    </Resizable>
  );
}

export default ChartContainer;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px;
  height: 100%;

  .highcharts-tracker {
    fill: red;
    cursor: pointer;
  }
`;

const Panel = styled.div`
  padding: 10px;
  overflow-y: auto;
  height: 100%;
`;

const Message = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  color: #0c0c0c;
`;

const baseOptions = {
  boost: {
    useGPUTranslations: true,
    seriesThreshold: 10,
  },
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
    title: {
      text: "Daily Confirmed Cases (per 100k inhabitants)",
    },
  },
  tooltip: {
    shared: true,
  },
  legend: {
    enabled: false,
    layout: "horizontal",
    align: "center",
    // x: 100,
    // verticalAlign: "top",
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

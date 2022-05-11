import HighchartsReact from "highcharts-react-official";
import { merge, startCase } from 'lodash';
import React, { useMemo } from 'react';
import Highcharts from "../../utils/highcharts";

function ChartContainer({ attribute, reversed = false, locationById, dataByLocationId }) {
    const chartOptions = useMemo(() => {
        return merge({}, baseOptions, {
            yAxis: {
                title: {
                    text: startCase(attribute)
                },
                reversed,
            },
            series: Object.entries(dataByLocationId).map(([locationId, rawData]) => {
                return {
                    name: locationById[locationId].name,
                    type: "spline",
                    data: rawData.map(x => ([new Date(x.date).getTime(), x[attribute]]))
                }
            })
        });
    }, [attribute, dataByLocationId, locationById, reversed]);

    return (
        <div>
            <HighchartsReact key={attribute} highcharts={Highcharts} options={chartOptions} />
        </div>
    );
}

export default ChartContainer

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

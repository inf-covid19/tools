import HighchartsReact from "highcharts-react-official";
import { first, last, merge } from "lodash";
import React, { useMemo } from "react";
import Highcharts from "../../utils/highcharts";
import { MeasuresConfig } from "./utils/constants";
import { getRestrictionPoints } from "./utils/functions";

const defaultPolicies = ["stay_home_restrictions", "workplace_closing", "school_closing"];

function LocationRestrictions({ records, featuredConfirmedPeriods, featuredDeathsPeriods, location, covidVariants, policies = defaultPolicies }) {
  const chartOptions = useMemo(() => {
    const data = policies.flatMap((policy) => {
      const points = getRestrictionPoints(records, { restriction: policy });
      let startDate = first(records).date;

      const dataPoints = [];

      points.forEach((x, index, arr) => {
        const isLast = index === arr.length - 1;

        const dataPoint = {
          y: policies.indexOf(policy),
          x: startDate,
          x2: x.date,
          color: MeasuresConfig[policy].colorSchema(x.previousValue),
          regionName: location?.name,
          measureAttribute: policy,
          measureValue: x.previousValue,
        };
        dataPoints.push(dataPoint);
        startDate = x.date;

        if (isLast) {
          dataPoints.push({
            y: policies.indexOf(policy),
            x: x.date,
            x2: last(records).date,
            color: MeasuresConfig[policy].colorSchema(x[policy]),
            regionName: location?.name,
            measureAttribute: policy,
            measureValue: x[policy],
          });
        }
      });
      return dataPoints;
    });

    return merge({}, baseOptions, {
      chart: {
        height: 100 + policies.length * 30,
        spacingLeft: 100,
      },
      yAxis: {
        categories: policies,
        labels: {
          enabled: false,
        },
      },
      // annotations: [
      //   // {
      //   //   draggable: "",
      //   //   shapes: mapPoints(stay_home_restrictions_points, "stay_home_restrictions", {}, { getColor: d3.interpolateBuPu }),
      //   // },
      //   // {
      //   //   draggable: "",
      //   //   shapes: mapPoints(workplace_closing_points, "workplace_closing", { type: "rect", width: 10, height: 10 }, { getColor: d3.interpolateOrRd }),
      //   // },
      //   // {
      //   //   draggable: "",
      //   //   shapes: mapPoints(school_closing_points, "school_closing", {}, { getColor: d3.interpolateYlGn }),
      //   // },
      //   {
      //     draggable: "",
      //     labelOptions: {
      //       shape: "connector",
      //       align: "right",
      //       y: -40,
      //       justify: false,
      //       crop: true,
      //       style: {
      //         fontSize: "0.8em",
      //         textOutline: "1px white",
      //       },
      //     },
      //     labels: Object.entries(get(covidVariants, location.isCountry ? location.name : location.country, {})).map(([label, date]) => {
      //       return {
      //         point: { xAxis: 0, yAxis: 0, x: new Date(recordByDate[date].date).getTime(), y: recordByDate[date][attrY] },
      //         text: `${label} detected`,
      //       };
      //     }),
      //   },
      //   {
      //     draggable: "",
      //     labels: vacinationMilestones.map(({ date: rawDate, label }) => {
      //       const date = new Date(rawDate).toISOString().slice(0, 10);

      //       return {
      //         allowOverlap: true,
      //         point: { xAxis: 0, yAxis: 0, x: new Date(recordByDate[date].date).getTime(), y: recordByDate[date][attrY] },
      //         text: label,
      //       };
      //     }),
      //   },
      // ],
      series: [
        {
          name: location.displayName,
          borderColor: "gray",
          pointWidth: 20,
          data: data,
          dataLabels: {
            enabled: true,
          },
        },
      ],
    });
  }, [policies, location, records]);

  return (
    <div>
      <HighchartsReact key={`${location.id}:restrictions`} highcharts={Highcharts} options={chartOptions} />
    </div>
  );
}

export default LocationRestrictions;

const baseOptions = {
  chart: {
    type: "xrange",
    // width: 920,
    // height: 400,
  },
  title: {
    text: null,
  },
  credits: {
    enabled: false,
  },
  xAxis: {
    type: "datetime",
  },
  tooltip: {
    pointFormatter() {
      const { measureAttribute, measureValue, regionName } = this;
      const config = MeasuresConfig[measureAttribute];

      const effectiveValue = Math.abs(measureValue);
      const isTargeted = measureValue < 0;

      return `
        Location: <b>${regionName}</b><br/>
        Policy: <b>${config.name}</b><br/>
        Indicator: <b>${effectiveValue}</b> - ${config.indicators[effectiveValue]}<br/>

        <i>${isTargeted ? "This is a targeted policy." : "This is a general policy."}</i>
      `;
    },
  },
  yAxis: {
    title: {
      text: "",
    },
    // categories: categories.map((x) => {
    //   const config = MeasuresConfig[x];
    //   if (!config) {
    //     return `(compare with ${secondRegionData?.name})`;
    //   }
    //   return `${config.name} (${config.scale})`;
    // }),
    reversed: true,
  },
  legend: {
    enabled: false,
  },
};

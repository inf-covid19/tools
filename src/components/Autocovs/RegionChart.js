import { Loader } from "semantic-ui-react";
import { useQuery } from "react-query";
import styled from "styled-components";
import React, { useMemo } from "react";

import { AUTOCOVS_API as API_URL } from "../../constants";

import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import more from "highcharts/highcharts-more";
import xrange from "highcharts/modules/xrange";
import { transparentize } from "polished";

more(Highcharts);
xrange(Highcharts);


const COLOR_3_SCALE = ['#ffeda0','#feb24c','#f03b20']
const COLOR_4_SCALE = ['#ffffb2','#fecc5c','#fd8d3c','#e31a1c']
const COLOR_5_SCALE = ['#ffffb2','#fecc5c','#fd8d3c','#f03b20','#bd0026']
// const COLOR_6_SCALE = ["#ffffb2", "#fed976", "#feb24c", "#fd8d3c", "#f03b20", "#bd0026"];


const PeriodColors = ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f"];

const Measures = {
  school_closing: "School Closing",
  workplace_closing: "Workplace Closing",
  cancel_events: "Cancel Events",
  gatherings_restrictions: "Gatherings Restrictions",
  transport_closing: "Transport Closing",
  stay_home_restrictions: "Stay Home Restrictions",
  internal_movement_restrictions: "Internal Movement Restrictions",
  international_movement_restrictions: "International Movement Restrictions",
  information_campaigns: "Information Campaigns",
  testing_policy: "Testing Policy",
  contact_tracing: "Contact Tracing",
};

const MeasuresColors = {
  school_closing: COLOR_4_SCALE,
  workplace_closing: COLOR_4_SCALE,
  cancel_events: COLOR_3_SCALE,
  gatherings_restrictions: COLOR_5_SCALE,
  transport_closing: COLOR_3_SCALE,
  stay_home_restrictions: COLOR_4_SCALE,
  internal_movement_restrictions: COLOR_3_SCALE,
  international_movement_restrictions: COLOR_5_SCALE,
  information_campaigns: COLOR_3_SCALE,
  testing_policy: COLOR_4_SCALE,
  contact_tracing: COLOR_3_SCALE,
}

async function fetchRecords(region) {
  const response = await fetch(`${API_URL}/records/${region}`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
}
async function fetchFeaturedPeriods(region, options) {
  const qa = new URLSearchParams();

  Object.entries(options).forEach(([key, value]) => {
    qa.append(key, value);
  });

  const response = await fetch(`${API_URL}/featured_periods/${region}?${qa.toString()}`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
}

function RegionChart({ region, regionData, attribute, title, config = {} }) {
  const { data: records, status: recordsStatus } = useQuery(region && ["records", region], () => fetchRecords(region));

  const { data: featuredPeriods, status: featuredPeriodsStatus } = useQuery(region && ["featured_periods", region, attribute, config], () =>
    fetchFeaturedPeriods(region, {
      ...config,
      target_column: attribute,
    })
  );

  const isLoading = [recordsStatus, featuredPeriodsStatus].includes("loading");

  const timelineOptions = useMemo(() => {
    const categories = Object.keys(Measures);

    const startDate = {};

    const data = [];

    // eslint-disable-next-line no-unused-expressions
    records?.forEach((record, index, arr) => {
      const prevRecord = index > 0 ? arr[index - 1] : null;
      const isLast = index === arr.length - 1;

      categories.forEach((attr, y) => {
        const colorScale = MeasuresColors[attr];

        if (prevRecord === null) {
          startDate[attr] = record.date;
          return;
        }

        if (Math.abs(record[attr]) !== Math.abs(prevRecord[attr])) {
          const endDate = prevRecord.date;
          data.push({
            y,
            x: startDate[attr],
            x2: endDate,
            color: colorScale[Math.abs(prevRecord[attr])],
          });
          startDate[attr] = record.date;
        }

        if (isLast) {
          data.push({
            y,
            x: startDate[attr],
            x2: record.date,
            color: colorScale[Math.abs(record[attr])],
          });
        }
      });
    });

    return {
      chart: {
        type: "xrange",
        width: 920,
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
      yAxis: {
        title: {
          text: "",
        },
        categories: categories.map((k) => Measures[k]),
        reversed: true,
      },
      legend: {
        enabled: false,
      },
      series: [
        {
          name: regionData?.displayName || region,
          borderColor: "gray",
          pointWidth: 20,
          data: data,
          dataLabels: {
            enabled: true,
          },
        },
      ],
    };
  }, [records, region, regionData]);

  const chartOptions = useMemo(() => {
    return {
      chart: {
        zoomType: "x",
        height: 300,
        width: 920,
        spacingLeft: 150,
      },
      title: {
        text: null,
      },
      credits: {
        enabled: false,
      },
      xAxis: {
        type: "datetime",
        plotBands: featuredPeriods?.featured_periods.map(({ start, end, id }, index) => {
          return {
            color: transparentize(0.5, PeriodColors[index % PeriodColors.length]), // Color value
            from: start, // Start of the plot band
            to: end, // End of the plot band
          };
        }),
      },
      yAxis: {
        title: {
          text: title,
        },
      },
      legend: {
        enabled: false,
      },
      plotOptions: {
        area: {
          fillColor: {
            linearGradient: {
              x1: 0,
              y1: 0,
              x2: 0,
              y2: 1,
            },
            stops: [
              [0, Highcharts.getOptions().colors[0]],
              [1, Highcharts.color(Highcharts.getOptions().colors[0]).setOpacity(0).get("rgba")],
            ],
          },
          marker: {
            radius: 2,
          },
          lineWidth: 1,
          states: {
            hover: {
              lineWidth: 1,
            },
          },
          threshold: null,
        },
      },
      series: [
        {
          type: "area",
          name: title,
          data: records?.map((x) => [new Date(x.date).getTime(), x[attribute]]),
        },
        {
          type: "line",
          color: "red",
          name: `${title} (Smoothed)`,
          data: featuredPeriods?.records.map((x) => [new Date(x.date).getTime(), Math.max(0, x[`${attribute}_smoothed`])]),
        },
      ],
    };
  }, [attribute, featuredPeriods, records, title]);

  if (isLoading) {
    return (
      <Container>
        <Loader active inline />
      </Container>
    );
  }

  return (
    <div>
      <Container>
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      </Container>

      <Container>
        <HighchartsReact highcharts={Highcharts} options={timelineOptions} />
      </Container>
    </div>
  );
}

export default RegionChart;

const Container = styled.div``;

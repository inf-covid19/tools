import { Loader } from "semantic-ui-react";
import { useQuery } from "react-query";
import styled from "styled-components";
import React, { useMemo } from "react";
import * as d3 from "d3";

import { AUTOCOVS_API as API_URL } from "../../constants";

import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import more from "highcharts/highcharts-more";
import xrange from "highcharts/modules/xrange";
import { transparentize } from "polished";
import { sortBy } from "lodash";

import RegionInsights from "./RegionInsights";

more(Highcharts);
xrange(Highcharts);

const PeriodColors = ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f"];

const colorSchema = d3.interpolateYlOrRd;

const MeasuresConfig = {
  school_closing: {
    name: "School Closing",
    scale: "0..3",
    colorScale: (x) => colorSchema(x / 3),
    indicators: {
      0: "no measures",
      1: "recommend closing or all schools open with alterations resulting in significant differences compared to non-Covid-19 operations",
      2: "require closing (only some levels or categories, eg just high school, or just public schools)",
      3: "require closing all levels",
    },
  },
  workplace_closing: {
    name: "Workplace Closing",
    scale: "0..3",
    colorScale: (x) => colorSchema(x / 3),
    indicators: {
      0: "no measures",
      1: "recommend closing (or recommend work from home) or all businesses open with alterations resulting in significant differences compared to non-Covid-19 operation",
      2: "require closing (or work from home) for some sectors or categories of workers",
      3: "require closing (or work from home) for all-but-essential workplaces (eg grocery stores, doctors)",
    },
  },
  cancel_events: {
    name: "Cancel Events",
    scale: "0..2",
    colorScale: (x) => colorSchema(x / 2),
    indicators: {
      0: "no measures",
      1: "recommend cancelling",
      2: "require cancelling",
    },
  },
  gatherings_restrictions: {
    name: "Gatherings Restrictions",
    scale: "0..4",
    colorScale: (x) => colorSchema(x / 4),
    indicators: {
      0: "no restrictions",
      1: "restrictions on very large gatherings (the limit is above 1000 people)",
      2: "restrictions on gatherings between 101-1000 people",
      3: "restrictions on gatherings between 11-100 people",
      4: "restrictions on gatherings of 10 people or less",
    },
  },
  transport_closing: {
    name: "Transport Closing",
    scale: "0..2",
    colorScale: (x) => colorSchema(x / 2),
    indicators: {
      0: "no measures",
      1: "recommend closing (or significantly reduce volume/route/means of transport available)",
      2: "require closing (or prohibit most citizens from using it)",
    },
  },
  stay_home_restrictions: {
    name: "Stay Home Restrictions",
    scale: "0..3",
    colorScale: (x) => colorSchema(x / 3),
    indicators: {
      0: "no measures",
      1: "recommend not leaving house",
      2: "require not leaving house with exceptions for daily exercise, grocery shopping, and ‘essential’ trips",
      3: "require not leaving house with minimal exceptions (eg allowed to leave once a week, or only one person can leave at a time, etc)",
    },
  },
  internal_movement_restrictions: {
    name: "Internal Movement Restrictions",
    scale: "0..2",
    colorScale: (x) => colorSchema(x / 2),
    indicators: {
      0: "no measures",
      1: "recommend not to travel between regions/cities",
      2: "internal movement restrictions in place",
    },
  },
  international_movement_restrictions: {
    name: "International Movement Restrictions",
    scale: "0..4",
    colorScale: (x) => colorSchema(x / 4),
    indicators: {
      0: "no restrictions",
      1: "screening arrivals",
      2: "quarantine arrivals from some or all regions",
      3: "ban arrivals from some regions",
      4: "ban on all regions or total border closure",
    },
  },
  information_campaigns: {
    name: "Information Campaigns",
    scale: "0..2",
    colorScale: (x) => colorSchema(x / 2),
    indicators: {
      0: "no Covid-19 public information campaign",
      1: "public officials urging caution about Covid-19",
      2: "coordinated public information campaign (eg across traditional and social media)",
    },
  },
  testing_policy: {
    name: "Testing Policy",
    scale: "0..3",
    colorScale: (x) => colorSchema(x / 3),
    indicators: {
      0: "no testing policy",
      1: "only those who both (a) have symptoms AND (b) meet specific criteria (eg key workers, admitted to hospital, came into contact with a known case, returned from overseas)",
      2: "testing of anyone showing Covid-19 symptoms",
      3: "open public testing (eg “drive through” testing available to asymptomatic people)",
    },
  },
  contact_tracing: {
    name: "Contact Tracing",
    scale: "0..2",
    colorScale: (x) => colorSchema(x / 2),
    indicators: {
      0: "no contact tracing",
      1: "limited contact tracing; not done for all cases",
      2: "comprehensive contact tracing; done for all identified cases",
    },
  },
  // TODO:
  // facial_coverings
  // vaccination_policy
  // elderly_people_protection
};

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
    qa.append(key, typeof value === "object" ? JSON.stringify(value) : value);
  });

  const response = await fetch(`${API_URL}/featured_periods/${region}?${qa.toString()}`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
}

function useTimelineOptions({ records, region, regionData }, { records: secondRecords, region: secondRegion, regionData: secondRegionData } = {}) {
  const timelineOptions = useMemo(() => {
    const hasSecondRegion = !!secondRegion;

    const categories = hasSecondRegion ? Object.keys(MeasuresConfig).flatMap((x) => [x, `${x} (Compare)`]) : Object.keys(MeasuresConfig);

    const makeData = (records, regionData, key = (x) => x, debug = false) => {
      const startDate = {};
      const data = [];
      // eslint-disable-next-line no-unused-expressions
      records?.forEach((record, index, arr) => {
        const prevRecord = index > 0 ? arr[index - 1] : null;
        const isLast = index === arr.length - 1;

        Object.keys(MeasuresConfig).forEach((attr) => {
          const { colorScale } = MeasuresConfig[attr];
          const y = categories.findIndex((x) => x === key(attr));

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
              color: colorScale(Math.abs(prevRecord[attr])),
              regionName: regionData?.name,
              measureAttribute: attr,
              measureValue: prevRecord[attr],
            });
            startDate[attr] = record.date;
          }

          if (isLast) {
            data.push({
              y,
              x: startDate[attr],
              x2: record.date,
              color: colorScale(Math.abs(record[attr])),
              regionName: regionData?.name,
              measureAttribute: attr,
              measureValue: record[attr],
            });
          }
        });
      });
      return data;
    };

    let data = makeData(records, regionData);

    if (hasSecondRegion) {
      data = [...data, ...makeData(secondRecords, secondRegionData, (x) => `${x} (Compare)`, true)];
    }

    data = sortBy(data, "y");

    return {
      chart: {
        type: "xrange",
        width: 920,
        height: hasSecondRegion ? 850 : 400,
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
            Policy Measure: <b>${config.name} (${config.scale})</b><br/>
            Indicator: <b>${effectiveValue}</b> - ${config.indicators[effectiveValue]}<br/>

            <i>${isTargeted ? "This is a targeted policy." : "This is a general policy."}</i>
          `;
        },
      },
      yAxis: {
        title: {
          text: "",
        },
        categories: categories.map((x) => {
          const config = MeasuresConfig[x];
          if (!config) {
            return `(compare with ${secondRegionData?.name})`;
          }
          return `${config.name} (${config.scale})`;
        }),
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
  }, [records, region, regionData, secondRecords, secondRegion, secondRegionData]);

  return timelineOptions;
}

function useChartOptions({ attribute, title, records, featuredPeriods, regionData }) {
  const chartOptions = useMemo(() => {
    return {
      chart: {
        zoomType: "x",
        height: 300,
        width: 920,
        spacingLeft: 165,
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
            label: { text: `#${index+1}` },
            color: transparentize(0.5, PeriodColors[index % PeriodColors.length]), // Color value
            from: start, // Start of the plot band
            to: end, // End of the plot band
          };
        }),
      },
      yAxis: {
        title: {
          text: regionData?.displayName,
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
  }, [attribute, featuredPeriods, records, regionData, title]);

  return chartOptions;
}

function RegionChart({ region, regionData, secondRegion, secondRegionData, attribute, title, config = {}, withInsights = false }) {
  const { data: records, status: recordsStatus } = useQuery(region && ["records", region], () => fetchRecords(region));
  const { data: secondRecords, status: secondRecordsStatus } = useQuery(secondRegion && ["records", secondRegion], () => fetchRecords(secondRegion));

  const { data: featuredPeriods, status: featuredPeriodsStatus } = useQuery(region && ["featured_periods", region, attribute, config], () =>
    fetchFeaturedPeriods(region, {
      ...config,
      target_column: attribute,
    })
  );

  const { data: secondFeaturedPeriods, status: secondFeaturedPeriodsStatus } = useQuery(secondRegion && ["featured_periods", secondRegion, attribute, config], () =>
    fetchFeaturedPeriods(secondRegion, {
      ...config,
      target_column: attribute,
    })
  );
  const isLoading = [recordsStatus, featuredPeriodsStatus, secondRecordsStatus, secondFeaturedPeriodsStatus].includes("loading");

  const timelineOptions = useTimelineOptions(
    { records, region, regionData },
    secondRegion ? { records: secondRecords, region: secondRegion, regionData: secondRegionData } : undefined
  );

  const chartOptions = useChartOptions({ attribute, title, records, featuredPeriods, regionData });
  const secondChartOptions = useChartOptions({ attribute, title, records: secondRecords, featuredPeriods: secondFeaturedPeriods, regionData: secondRegionData });

  if (isLoading) {
    return (
      <Container>
        <Loader active inline />
      </Container>
    );
  }

  return (
    <div>
      {withInsights && (
        <Container>
          <RegionInsights regionData={regionData} featuredPeriods={featuredPeriods} attribute={attribute} />
        </Container>
      )}

      <Container>
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
        {secondRegion && <HighchartsReact highcharts={Highcharts} options={secondChartOptions} />}
      </Container>

      <Container>
        <HighchartsReact highcharts={Highcharts} options={timelineOptions} />
      </Container>
    </div>
  );
}

export default RegionChart;

const Container = styled.div``;

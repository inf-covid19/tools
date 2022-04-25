import React, { useMemo } from "react";
import { Statistic, Icon } from "semantic-ui-react";
import { format } from "d3";
import { first, orderBy } from "lodash";

const displayNumberFormatter = format(",.2~f");

function RegionInsights({ regionData, featuredPeriods, attribute }) {
  const periodList = useMemo(() => {
    return featuredPeriods.featured_periods.map((x, index) => {
      const { start, end } = x;

      const records = featuredPeriods.records.filter((x) => start <= x.date && x.date < end).map((x) => x[`${attribute}_smoothed`]);

      return { ...x, index, records, width: end - start, maxRecord: Math.max(...records), minRecord: Math.min(...records) };
    });
  }, [attribute, featuredPeriods]);

  const highestPeekWave = useMemo(() => first(orderBy(periodList, "maxRecord", "desc")), [periodList]);
  const largestWidthWave = useMemo(() => first(orderBy(periodList, "width", "desc")), [periodList]);
  const steepestAscendWave = useMemo(() => {
    return first(
      orderBy(
        periodList,
        (x) => {
          const index = x.records.findIndex((y) => y === x.maxRecord);

          const beforePeekRecords = x.records.slice(0, index);

          return x.maxRecord - Math.min(...beforePeekRecords);
        },
        "desc"
      )
    );
  }, [periodList]);
  const steepestDescendWave = useMemo(() => {
    return first(
      orderBy(
        periodList,
        (x) => {
          const index = x.records.findIndex((y) => y === x.maxRecord);

          const afterPeekRecords = x.records.slice(index);

          return x.maxRecord - Math.min(...afterPeekRecords);
        },
        "desc"
      )
    );
  }, [periodList]);

  return (
    <div style={{ marginBottom: 20 }}>
      <h2>Insights</h2>

      <Statistic.Group size="tiny">
        <Statistic>
          <Statistic.Value>{displayNumberFormatter(featuredPeriods.featured_periods.length)}</Statistic.Value>
          <Statistic.Label>Featured periods</Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>
            <Icon name="arrows alternate vertical" /> #{highestPeekWave?.index + 1}
          </Statistic.Value>
          <Statistic.Label>Highest peak</Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>
            <Icon name="arrows alternate horizontal" /> #{largestWidthWave?.index + 1}
          </Statistic.Value>
          <Statistic.Label>Largest width</Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>
            <Icon name="level up" /> #{steepestAscendWave?.index + 1}
          </Statistic.Value>
          <Statistic.Label>Steepest ascend</Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>
            <Icon name="level down" /> #{steepestDescendWave?.index + 1}
          </Statistic.Value>
          <Statistic.Label>Steepest descend</Statistic.Label>
        </Statistic>
      </Statistic.Group>
    </div>
  );
}

export default RegionInsights;

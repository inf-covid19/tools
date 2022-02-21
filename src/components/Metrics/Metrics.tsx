import { first } from "lodash";
import React, { useCallback, useMemo, useState } from "react";
import { generatePath, useHistory, useParams } from "react-router-dom";
import { Header, Icon, Loader, Segment, Form } from "semantic-ui-react";
import styled from "styled-components/macro";
import useMetadata from "../../hooks/useMetadata";
import { getByRegionId } from "../../utils/metadata";
import RegionSelector from "../RegionSelector";
import ReproductionChart from "./charts/ReproductionChart";
import CasesChart from "./charts/CasesChart";
import DeathsChart from "./charts/DeathsChart";
import CaseFatalityChart from "./charts/CaseFatalityChart";
import { endOfToday, format, isBefore, parse } from "date-fns";
import { startOfToday } from "date-fns/esm";
import { DateRange } from "./charts/utils";
import VaccinesChart from "./charts/VaccinesChart";
import PeopleVaccinatedChart from "./charts/PeopleVaccinatedChart";

function Metrics() {
  const history = useHistory();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { region: regionKey } = useParams<{ region?: string }>();
  const selectedRegions = useMemo(() => (regionKey ? { [regionKey]: true } : {}), [regionKey]);

  const setSelectedRegions = useCallback(
    (regions) => {
      history.push({
        pathname: generatePath("/location-inspector/:region?", {
          region: first(Object.keys(regions)) || undefined,
        }),
      });
    },
    [history]
  );

  const { data: metadata } = useMetadata();

  const maxDate = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const dateRange = useMemo(() => {
    if (startDate && endDate) {
      const start = parse(startDate, "yyyy-MM-dd", startOfToday());
      const end = parse(endDate, "yyyy-MM-dd", endOfToday());

      if (isBefore(end, start)) {
        return undefined;
      }

      return [start, end] as DateRange;
    }

    return undefined;
  }, [endDate, startDate]);

  const currentRegion = useMemo(() => {
    if (!metadata) return null;

    return regionKey ? getByRegionId(metadata, regionKey) : null;
  }, [metadata, regionKey]);

  if (!metadata) {
    return (
      <LoaderWrapper>
        <Loader active inline />
      </LoaderWrapper>
    );
  }

  const regionSelector = (
    <RegionSelectorWrapper>
      <RegionSelector value={selectedRegions} onChange={setSelectedRegions} multiple={false} />
    </RegionSelectorWrapper>
  );

  if (!currentRegion) {
    return (
      <Container>
        <Segment placeholder>
          <Header icon>
            <Icon name="search" />
            Search for location
          </Header>
          {regionSelector}
        </Segment>
      </Container>
    );
  }

  return (
    <Container>
      {regionSelector}
      <RegionSelectorWrapper>
        <Form>
          <Form.Group widths="equal">
            <Form.Field>
              <label>From</label>
              <input type="date" placeholder="Enter from date" max={maxDate} value={startDate} onChange={({ target }) => setStartDate(target.value)} />
            </Form.Field>
            <Form.Field>
              <label>To</label>
              <input type="date" placeholder="Enter to date" max={maxDate} value={endDate} onChange={({ target }) => setEndDate(target.value)} />
            </Form.Field>
          </Form.Group>
        </Form>
      </RegionSelectorWrapper>
      <ChartContainer>
        <CasesChart regionId={currentRegion.key} dateRange={dateRange} />
        <DeathsChart regionId={currentRegion.key} dateRange={dateRange} />
        <ReproductionChart regionId={currentRegion.key} dateRange={dateRange} />
        <CaseFatalityChart regionId={currentRegion.key} dateRange={dateRange} />
        <VaccinesChart regionId={currentRegion.key} dateRange={dateRange} />
        <PeopleVaccinatedChart regionId={currentRegion.key} dateRange={dateRange} />
      </ChartContainer>
    </Container>
  );
}

export default Metrics;

const LoaderWrapper = styled.div`
  height: 350px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const RegionSelectorWrapper = styled.div`
  width: 100%;
  max-width: 450px;
  margin: 0 auto 12px;
`;

const Container = styled.div`
  padding: 0 20px;
`;

const ChartContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  grid-gap: 30px;
  margin-top: 20px;

  @media screen and (max-width: 500px) {
    grid-template-columns: 100%;
  }
`;

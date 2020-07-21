import { first } from "lodash";
import React, { useCallback, useMemo } from "react";
import { generatePath, useHistory, useParams } from "react-router-dom";
import { Header, Icon, Loader, Segment } from "semantic-ui-react";
import styled from "styled-components/macro";
import useMetadata from "../../hooks/useMetadata";
import { getByRegionId } from "../../utils/metadata";
import RegionSelector from "../RegionSelector";
import ReproductionChart from "./charts/ReproductionChart";
import CasesChart from "./charts/CasesChart";
import DeathsChart from "./charts/DeathsChart";
import CaseFatalityChart from "./charts/CaseFatalityChart";
import useWhiteLabel from "../../hooks/useWhiteLabel";

function Metrics() {
  const history = useHistory();
  const { enabled: isWhiteLabelMode, defaultRegion } = useWhiteLabel();

  const { region: regionKeyParam } = useParams<{ region?: string }>();

  const regionKey = useMemo(() => {
    if (isWhiteLabelMode) {
      return defaultRegion;
    }

    return regionKeyParam;
  }, [defaultRegion, isWhiteLabelMode, regionKeyParam]);

  const selectedRegions = useMemo(() => (regionKey ? { [regionKey]: true } : {}), [regionKey]);

  const setSelectedRegions = useCallback(
    (regions) => {
      history.push({
        pathname: generatePath("/metrics/:region?", {
          region: first(Object.keys(regions)) || undefined,
        }),
      });
    },
    [history]
  );

  const { data: metadata } = useMetadata();

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
  const regionSelector = isWhiteLabelMode ? null : (
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
            Search Region
          </Header>
          {regionSelector}
        </Segment>
      </Container>
    );
  }

  return (
    <Container>
      {regionSelector}

      <ChartContainer>
        <CasesChart regionId={currentRegion.key} />
        <DeathsChart regionId={currentRegion.key} />
        <ReproductionChart regionId={currentRegion.key} />
        <CaseFatalityChart regionId={currentRegion.key} />
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
  max-width: 350px;
  margin: 0 auto;
`;

const Container = styled.div`
  padding: 0 20px;
`;

const ChartContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  grid-gap: 30px;
  margin-top: 20px;

  @media screen and (max-width: 500px) {
    grid-template-columns: 100%;
  }
`;

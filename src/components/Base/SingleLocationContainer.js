import { first } from "lodash";
import React, { useCallback, useMemo } from "react";
import { generatePath, useHistory, useParams } from "react-router-dom";
import { Header, Icon, Loader, Segment } from "semantic-ui-react";
import styled from "styled-components";
import useMetadata from "../../hooks/useMetadata";
import { getByRegionId } from "../../utils/metadata";
import RegionSelector from "../RegionSelector";

function SingleLocationContainer({ route, children }) {
  const history = useHistory();
  const { region: regionKey } = useParams();
  const selectedRegions = useMemo(() => (regionKey ? { [regionKey]: true } : {}), [regionKey]);
  const setSelectedRegions = useCallback(
    (regions) => {
      history.push({
        pathname: generatePath(`${route}/:region?`, {
          region: first(Object.keys(regions)) || undefined,
        }),
      });
    },
    [history, route]
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

      <Content>
        {children({ currentLocation: currentRegion })}
      </Content>
    </Container>
  );
}

export default SingleLocationContainer;

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

const Content = styled.div``;

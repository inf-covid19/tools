import { format } from "d3";
import { differenceInDays } from "date-fns";
import { castArray, defaultTo, last } from "lodash";
import first from "lodash/first";
import React, { useCallback, useMemo } from "react";
import { useQuery } from "react-query";
import { generatePath, useHistory, useParams } from "react-router-dom";
import { Divider, Dropdown, Flag, Grid, Header, Icon, List, Loader, Segment, SemanticICONS, Statistic } from "semantic-ui-react";
import styled from "styled-components";
import CustomizableChart from "../../components/CustomizableChart";
import RegionSelector from "../../components/RegionSelector";
import TrendChart from "../../components/TrendChart";
import { DEFAULT_OPTIONS } from "../../constants";
import useMetadata from "../../hooks/useMetadata";
import useQueryString from "../../hooks/useQueryString";
import useRegionData from "../../hooks/useRegionData";
import { getByRegionId } from "../../utils/metadata";
import { titleCase } from "../../utils/string";
import { makeGet } from "../Storytelling/utils/api";
import VisibilityControl from "../VisibilityControl";
import "./Explorer.css";
import MaintenanceBanner from "./MaintenanceBanner";

const displayNumberFormatter = format(",.2~f");

const similarityOptions = [
  {
    key: "confirmed_daily_21d",
    text: "confirmed",
    value: "confirmed_daily_21d",
    content: "Confirmed",
  },
  {
    key: "deaths_daily_21d",
    text: "deaths",
    value: "deaths_daily_21d",
    content: "Deaths",
  },
  {
    key: "confirmed_by_100k_daily_21d",
    text: "cases per 100k inhab.",
    value: "confirmed_by_100k_daily_21d",
    content: "Cases per 100k inhab.",
  },
  {
    key: "deaths_by_100k_daily_21d",
    text: "deaths per 100k inhab.",
    value: "deaths_by_100k_daily_21d",
    content: "Deaths per 100k inhab.",
  },
];

const Explorer = () => {
  const history = useHistory();
  const { region: regionKey } = useParams<{ region?: string }>();
  const [query, setQuery] = useQueryString();

  const region = useMemo(() => (regionKey ? { [regionKey]: true } : {}), [regionKey]);

  const aspect = useMemo(() => similarityOptions.find((opt) => opt.value === query.aspect)?.value ?? "confirmed_daily_21d", [query.aspect]);

  const aspectOption = useMemo(() => similarityOptions.find((opt) => opt.value === aspect), [aspect]);

  const secondary = useMemo(() => `${first(castArray(defaultTo(query.secondary, "")))}`, [query.secondary]);

  const setSecondary = (value: string) => {
    setQuery({
      secondary: value,
    });
  };

  const setAspect = (value: string) => {
    setQuery({
      aspect: value,
      secondary: "",
    });
  };

  const setSelectedRegions = useCallback(
    (regions) => {
      history.push({
        pathname: generatePath("/similarity-explorer/:region?", {
          region: first(Object.keys(regions)) || undefined,
        }),
        search: `?aspect=${aspect}`,
      });
    },
    [aspect, history]
  );

  const { data: metadata } = useMetadata();

  const currentRegion = useMemo(() => {
    if (!metadata) return null;
    const selectedKey = first(Object.keys(region));
    return selectedKey ? getByRegionId(metadata, selectedKey) : null;
  }, [region, metadata]);

  const { data: topSimilarData } = useQuery(currentRegion && ["region-similar", currentRegion?.key, aspect], () => {
    return currentRegion ? makeGet(`/rank/${aspect}/${currentRegion.key}`, { limit: 25 }) : Promise.resolve(null);
  });

  const isIncidence = aspect.includes("100k");

  const sortedTopSimilar: Array<{ location_id: string; distance: number; location: ReturnType<typeof getByRegionId> }> = useMemo(() => {
    if (!topSimilarData || !currentRegion || !metadata) return [];

    // let effectiveTopSimilar = topSimilarData;

    // effectiveTopSimilar = orderBy(effectiveTopSimilar, (x) => Number(x[aspect]), "asc");

    // const maxDistance = Math.max(...effectiveTopSimilar.map((i) => Number(i.distance ?? 0)));

    // const withSimilarity = orderBy(
    //   effectiveTopSimilar.map((item) => {
    //     const region = dataByKey[item.region!];
    //     const similarity = 1 - Number(item[aspect] ?? 0) / maxDistance;
    //     const daysFactor = Math.min(1, region.days / days);

    //     item["similarity"] = `${similarity * daysFactor}`;
    //     return item;
    //   }),
    //   (x) => Number(x.similarity),
    //   "desc"
    // );

    return topSimilarData.map((x: { location_id: string; distance: number }) => ({
      ...x,
      location: getByRegionId(metadata, x.location_id),
    }));
  }, [currentRegion, metadata, topSimilarData]);

  // const clusterBuddies = useMemo(() => {
  //   if (!currentRegion || !topSimilarData) return [];

  //   return orderBy(dataByCluster[currentRegion.cluster], (item) => dataByKey[item.key]?.displayName);
  // }, [currentRegion, dataByCluster, dataByKey, topSimilarData]);

  const secondaryRegion = useMemo(() => {
    const secondaryData = sortedTopSimilar?.find((x: any) => x.location_id === secondary);
    if (secondaryData) {
      return secondaryData.location;
    }
    if (sortedTopSimilar?.length > 0) {
      return (first(sortedTopSimilar) as any).location;
    }
    return null;
  }, [secondary, sortedTopSimilar]);

  const chartRegions = useMemo(() => {
    if (!currentRegion || !secondaryRegion) {
      return {};
    }

    return { [currentRegion.key]: true, [secondaryRegion.key]: true };
  }, [currentRegion, secondaryRegion]);

  const regionIds = useMemo(() => {
    if (!currentRegion || !secondaryRegion) {
      return [];
    }
    return [currentRegion.key, secondaryRegion.key];
  }, [currentRegion, secondaryRegion]);

  const dataByKey = useMemo(() => {
    if (!metadata) return {};
    return Object.fromEntries(regionIds.map((id) => [id, getByRegionId(metadata, id)]));
  }, [metadata, regionIds]);

  const { data: regionData } = useRegionData(regionIds);

  const timelineStats = useMemo(() => {
    const stats: Record<
      string,
      { sinceFirstCase: number; sinceFirstDeath: number; latestCases: number; latestDeaths: number; latestCasesPer100k: number; latestDeathsPer100k: number; latestDate: Date }
    > = {};

    if (!regionData || Object.keys(regionData).length < 2) {
      return undefined;
    }

    Object.entries(regionData).forEach(([key, timeline]) => {
      const firstCase = timeline.find((row) => row.confirmed > 0);
      const firstDeath = timeline.find((row) => row.deaths > 0);

      const latestRow = last(timeline);

      const locationData = dataByKey[key];

      stats[key] = {
        sinceFirstCase: firstCase ? differenceInDays(new Date(), firstCase.date) : 0,
        sinceFirstDeath: firstDeath ? differenceInDays(new Date(), firstDeath.date) : 0,
        latestCases: latestRow?.confirmed ?? 0,
        latestDeaths: latestRow?.deaths ?? 0,
        latestCasesPer100k: ((latestRow?.confirmed ?? 0) / (locationData?.population ?? 1)) * 100000,
        latestDeathsPer100k: ((latestRow?.deaths ?? 0) / (locationData?.population ?? 1)) * 100000,
        latestDate: latestRow?.date ?? new Date(),
      };
    });

    return stats;
  }, [dataByKey, regionData]);

  const isMaintenanceMode = false;
  if (isMaintenanceMode) {
    return <MaintenanceBanner />;
  }

  const regionSelector = (
    <div style={{ width: "100%", maxWidth: "450px", margin: "0 auto" }}>
      <RegionSelector value={region} onChange={setSelectedRegions} multiple={false} />
    </div>
  );

  if (!currentRegion) {
    return (
      <div style={{ padding: "0 20px" }}>
        <Segment placeholder>
          <Header icon>
            <Icon name="search" />
            Search for location
          </Header>
          {regionSelector}
        </Segment>
      </div>
    );
  }

  if (topSimilarData?.length && sortedTopSimilar?.length === 0) {
    return (
      <div style={{ padding: "0 20px" }}>
        <Segment placeholder>
          <Header style={{ fontWeight: 500 }} icon>
            <Icon name="folder open outline" />
            Oh no! Looks like we don't have similar regions <br /> to <b>{currentRegion.displayName}</b> regarding <b>{aspectOption?.content}</b>.
          </Header>

          <Segment basic textAlign="center">
            <Grid columns={2} stackable>
              <Grid.Column>
                <Header>Search for another region</Header>
                {regionSelector}
              </Grid.Column>

              <Grid.Column>
                <Header>Change selected aspect</Header>
                <div style={{ width: "100%", maxWidth: "350px", margin: "0 auto", textTransform: "capitalize" }}>
                  <Dropdown
                    selection
                    fluid
                    search
                    style={{ fontWeight: 700 }}
                    className="large"
                    onChange={(_: any, { value }: any) => setAspect(value)}
                    options={similarityOptions}
                    value={aspect}
                  />
                </div>
              </Grid.Column>
            </Grid>
            <Divider vertical>Or</Divider>
          </Segment>
        </Segment>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 20px" }}>
      {regionSelector}

      {timelineStats && topSimilarData && topSimilarData.length > 0 && secondaryRegion ? (
        <Container>
          <div style={{ padding: 10 }}>
            <Segment>
              <Header as="h3">
                <div className="header--dropdown">
                  Top-similar by{" "}
                  <Dropdown
                    style={{ fontWeight: 700 }}
                    className="large"
                    button
                    basic
                    compact
                    onChange={(_: any, { value }: any) => setAspect(value)}
                    options={similarityOptions}
                    value={aspect}
                  />
                </div>
                <Header.Subheader>Regions with similar epidemiological timeline</Header.Subheader>
              </Header>
              <div style={{ maxHeight: "250px", overflow: "auto" }}>
                <List relaxed>
                  {sortedTopSimilar?.slice(0, 99).map((r, idx) => (
                    <List.Item
                      href="#"
                      onClick={(evt) => {
                        evt.preventDefault();
                        setSecondary(r.location_id!);
                      }}
                      key={r.location_id}
                    >
                      <div>
                        <span style={{ display: "inline-block", opacity: 0.8, color: "rgba(0,0,0,.87)", width: "20px", marginRight: 5 }}>{idx + 1}</span>
                        <Flag name={r.location.flag} />
                        {r.location.displayName}
                        {/* {r.location.cluster === currentRegion.cluster && (
                          <>
                            {" "}
                            <Popup
                              basic
                              trigger={<Icon name="star" color="yellow" />}
                              content={`${dataByKey[r.region!].displayName} has similar attributes when compared to ${currentRegion.displayName}`}
                            />
                          </>
                        )} */}
                        {/* {" "}
                        <Label style={{ display: "none" }} size="tiny" color={getColor(r.similarity)}>
                          {displayNumberFormatter(parseFloat(r.similarity!) * 100)}%
                        </Label> */}
                      </div>
                    </List.Item>
                  ))}
                </List>
              </div>

              {/* <Header as="h3">
                Cluster
                <Header.Subheader>Regions with similar population and area</Header.Subheader>
              </Header>
              <div style={{ maxHeight: "250px", overflow: "auto" }}>
                <List relaxed>
                  {clusterBuddies.map((r) =>
                    r.key === currentRegion?.key ? (
                      <List.Item key={r.key}>
                        <Flag name={r.flag} />
                        {r.displayName}
                      </List.Item>
                    ) : (
                      <List.Item
                        href="#"
                        onClick={(evt) => {
                          evt.preventDefault();
                          setSecondary(r.key);
                        }}
                        key={r.key}
                      >
                        <Flag name={r.flag} />
                        {r.displayName}
                      </List.Item>
                    )
                  )}
                </List>
              </div> */}
            </Segment>
          </div>

          <div style={{ padding: 10 }}>
            <Segment>
              <Grid stackable columns={2}>
                <Grid.Column>
                  <Header as="h3">
                    <Flag name={currentRegion.flag} /> {currentRegion.displayName}
                  </Header>
                  <Statistic.Group horizontal size="tiny">
                    <Statistic>
                      <Statistic.Value>{displayNumberFormatter(timelineStats[currentRegion.key]?.latestCases)}</Statistic.Value>
                      <Statistic.Label>Confirmed cases</Statistic.Label>
                    </Statistic>
                    <Statistic>
                      <Statistic.Value>{displayNumberFormatter(timelineStats[currentRegion.key]?.latestDeaths)}</Statistic.Value>
                      <Statistic.Label>Confirmed deaths</Statistic.Label>
                    </Statistic>
                    <Statistic>
                      <Statistic.Value>{displayNumberFormatter(timelineStats[currentRegion.key]?.latestCasesPer100k)}</Statistic.Value>
                      <Statistic.Label>Confirmed cases per 100k inhab.</Statistic.Label>
                    </Statistic>
                    <Statistic>
                      <Statistic.Value>{displayNumberFormatter(timelineStats[currentRegion.key]?.latestDeathsPer100k)}</Statistic.Value>
                      <Statistic.Label>Confirmed deaths per 100k inhab.</Statistic.Label>
                    </Statistic>
                    <Statistic>
                      <Statistic.Value>{displayNumberFormatter(currentRegion.population)}</Statistic.Value>
                      <Statistic.Label>Population</Statistic.Label>
                    </Statistic>
                    {/* <Statistic>
                      <Statistic.Value>{displayNumberFormatter(currentRegion.area_km)}</Statistic.Value>
                      <Statistic.Label>km²</Statistic.Label>
                    </Statistic>
                    <Statistic>
                      <Statistic.Value>{displayNumberFormatter(currentRegion.population_density)}</Statistic.Value>
                      <Statistic.Label>inhab/km²</Statistic.Label>
                    </Statistic> */}
                    <Statistic>
                      <Statistic.Value>{displayNumberFormatter(timelineStats[currentRegion.key]?.sinceFirstCase)}</Statistic.Value>
                      <Statistic.Label>Days since first case</Statistic.Label>
                    </Statistic>
                    <Statistic>
                      <Statistic.Value>{displayNumberFormatter(timelineStats[currentRegion.key]?.sinceFirstDeath)}</Statistic.Value>
                      <Statistic.Label>Days since first death</Statistic.Label>
                    </Statistic>
                  </Statistic.Group>
                </Grid.Column>
                <Grid.Column>
                  <Header as="h3">
                    <Flag name={secondaryRegion.flag} />
                    {secondaryRegion?.displayName}
                  </Header>
                  <Statistic.Group horizontal size="tiny">
                    <Statistic>
                      <Statistic.Value>
                        <DiffIndicator primaryValue={timelineStats[currentRegion.key]?.latestCases} secondaryValue={timelineStats[secondaryRegion.key]?.latestCases} />{" "}
                        {displayNumberFormatter(timelineStats[secondaryRegion.key]?.latestCases)}
                      </Statistic.Value>
                      <Statistic.Label>Confirmed cases</Statistic.Label>
                    </Statistic>
                    <Statistic>
                      <Statistic.Value>
                        <DiffIndicator primaryValue={timelineStats[currentRegion.key]?.latestDeaths} secondaryValue={timelineStats[secondaryRegion.key]?.latestDeaths} />{" "}
                        {displayNumberFormatter(timelineStats[secondaryRegion.key]?.latestDeaths)}
                      </Statistic.Value>
                      <Statistic.Label>Confirmed deaths</Statistic.Label>
                    </Statistic>
                    <Statistic>
                      <Statistic.Value>
                        <DiffIndicator
                          primaryValue={timelineStats[currentRegion.key]?.latestCasesPer100k}
                          secondaryValue={timelineStats[secondaryRegion.key]?.latestCasesPer100k}
                        />{" "}
                        {displayNumberFormatter(timelineStats[secondaryRegion.key]?.latestCasesPer100k)}
                      </Statistic.Value>
                      <Statistic.Label>Confirmed cases per 100k inhab.</Statistic.Label>
                    </Statistic>
                    <Statistic>
                      <Statistic.Value>
                        <DiffIndicator
                          primaryValue={timelineStats[currentRegion.key]?.latestDeathsPer100k}
                          secondaryValue={timelineStats[secondaryRegion.key]?.latestDeathsPer100k}
                        />{" "}
                        {displayNumberFormatter(timelineStats[secondaryRegion.key]?.latestDeathsPer100k)}
                      </Statistic.Value>
                      <Statistic.Label>Confirmed deaths per 100k inhab.</Statistic.Label>
                    </Statistic>
                    <Statistic>
                      <Statistic.Value>
                        <DiffIndicator primaryValue={currentRegion.population} secondaryValue={secondaryRegion.population} /> {displayNumberFormatter(secondaryRegion.population)}
                      </Statistic.Value>
                      <Statistic.Label>Population</Statistic.Label>
                    </Statistic>
                    {/* <Statistic>
                      <Statistic.Value>
                        <DiffIndicator primaryValue={currentRegion.area_km} secondaryValue={secondaryRegion.area_km} /> {displayNumberFormatter(secondaryRegion.area_km)}
                      </Statistic.Value>
                      <Statistic.Label>km²</Statistic.Label>
                    </Statistic>
                    <Statistic>
                      <Statistic.Value>
                        <DiffIndicator primaryValue={currentRegion.population_density} secondaryValue={secondaryRegion.population_density} />{" "}
                        {displayNumberFormatter(secondaryRegion.population_density)}
                      </Statistic.Value>
                      <Statistic.Label>inhab/km²</Statistic.Label>
                    </Statistic> */}
                    <Statistic>
                      <Statistic.Value>
                        <DiffIndicator primaryValue={timelineStats[currentRegion.key]?.sinceFirstCase} secondaryValue={timelineStats[secondaryRegion.key]?.sinceFirstCase} />{" "}
                        {displayNumberFormatter(timelineStats[secondaryRegion.key]?.sinceFirstCase)}
                      </Statistic.Value>
                      <Statistic.Label>Days since first case</Statistic.Label>
                    </Statistic>
                    <Statistic>
                      <Statistic.Value>
                        <DiffIndicator primaryValue={timelineStats[currentRegion.key]?.sinceFirstDeath} secondaryValue={timelineStats[secondaryRegion.key]?.sinceFirstDeath} />{" "}
                        {displayNumberFormatter(timelineStats[secondaryRegion.key]?.sinceFirstDeath)}
                      </Statistic.Value>
                      <Statistic.Label>Days since first death</Statistic.Label>
                    </Statistic>
                  </Statistic.Group>
                </Grid.Column>
              </Grid>
            </Segment>
            <RelativeSegment>
              <Header as="h3">{`${titleCase(isIncidence ? "confirmed_by_100k_daily_21d" : "confirmed_daily_21d")} - Comparison between ${currentRegion?.displayName} and ${
                secondaryRegion?.displayName
              }`}</Header>
              <VisibilityControl>
                <CustomizableChart
                  {...DEFAULT_OPTIONS}
                  selectedRegions={chartRegions}
                  alignAt={1}
                  chartType="area"
                  isCumulative={false}
                  title=""
                  height={600}
                  metric={isIncidence ? "confirmed_by_100k_daily_21d" : "confirmed_daily_21d"}
                  timeserieSlice={-1}
                  isIncidence={false}
                  getPopulation={(key) => dataByKey[key].population}
                  isTrusted
                />
              </VisibilityControl>
            </RelativeSegment>
            <RelativeSegment>
              <Header as="h3">{`${titleCase(isIncidence ? "deaths_by_100k_daily_21d" : "deaths_daily_21d")} - Comparison between ${currentRegion?.displayName} and ${
                secondaryRegion?.displayName
              }`}</Header>
              <VisibilityControl>
                <CustomizableChart
                  {...DEFAULT_OPTIONS}
                  selectedRegions={chartRegions}
                  alignAt={1}
                  chartType="area"
                  isCumulative={false}
                  height={600}
                  metric={isIncidence ? "deaths_by_100k_daily_21d" : "deaths_daily_21d"}
                  title={""}
                  timeserieSlice={-1}
                  isIncidence={false}
                  getPopulation={(key) => dataByKey[key].population}
                  isTrusted
                />
              </VisibilityControl>
            </RelativeSegment>
            <RelativeSegment>
              <Header as="h3">
                Trend comparison between {currentRegion?.displayName} and {secondaryRegion?.displayName}
              </Header>
              <VisibilityControl>
                <Grid columns={2} stackable>
                  <Grid.Column>
                    <TrendChart {...DEFAULT_OPTIONS} selectedRegions={chartRegions} alignAt={1} height={600} metric={"confirmed"} title={``} />
                  </Grid.Column>
                  <Grid.Column>
                    <TrendChart {...DEFAULT_OPTIONS} selectedRegions={chartRegions} alignAt={1} height={600} metric={"deaths"} title={``} />
                  </Grid.Column>
                </Grid>
              </VisibilityControl>
            </RelativeSegment>
          </div>
        </Container>
      ) : (
        <div style={{ height: "350px", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Loader active inline>
            Processing latest data...
          </Loader>
        </div>
      )}
    </div>
  );
};

export default Explorer;

const Container = styled.div`
  display: grid;
  grid-template-columns: 450px 1fr;

  @media screen and (max-width: 500px) {
    grid-template-columns: 100%;
  }
`;

function DiffIndicator({ primaryValue, secondaryValue }: { primaryValue: number; secondaryValue: number }) {
  if (primaryValue === secondaryValue) {
    return <Icon name="minus" color="grey" />;
  }

  const diff = primaryValue - secondaryValue;
  const isHugeDiff = Math.abs(diff) > secondaryValue || Math.abs(diff) > primaryValue;

  return <Icon name={`angle ${isHugeDiff ? "double " : ""}${diff > 0 ? "down" : "up"}` as SemanticICONS} color={diff > 0 ? "red" : "green"} />;
}

const RelativeSegment = styled(Segment)`
  position: relative;
`;

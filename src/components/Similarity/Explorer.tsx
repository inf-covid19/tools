import React, { useState, useCallback, useMemo, useEffect } from "react";
import RegionSelector from "../RegionSelector";
import { Header, Segment, Icon, Flag, Grid, Statistic, Dropdown } from "semantic-ui-react";
import { format, csv } from "d3";
import { useQuery, queryCache } from "react-query";
import { Loader } from "semantic-ui-react";
import { keyBy, groupBy, orderBy, get } from "lodash";
import useMetadata from "../../hooks/useMetadata";
import { getByRegionId, getNameByRegionId } from "../../utils/metadata";
import { List, Popup } from "semantic-ui-react";
import first from "lodash/first";
import CustomizableChart from "../CustomizableChart";
import { DEFAULT_OPTIONS, SIMILARITY_API } from "../../constants";
import TrendChart from "../TrendChart";

const displayNumberFormatter = format(",.2~f");

const similarityOptions = [
  {
    key: "cases_distance",
    text: "cases",
    value: "cases_distance",
    content: "Cases",
  },
  {
    key: "deaths_distance",
    text: "deaths",
    value: "deaths_distance",
    content: "Deaths",
  },
  {
    key: "cases_per_100k_distance",
    text: "cases per 100k",
    value: "cases_per_100k_distance",
    content: "Cases per 100k",
  },
  {
    key: "deaths_per_100k_distance",
    text: "deaths per 100k",
    value: "deaths_per_100k_distance",
    content: "Deaths per 100k",
  },
];

const Explorer = () => {
  const [region, setRegion] = useState({});
  const [secondary, setSecondary] = useState("");

  const setSelectedRegions = useCallback((regions) => {
    setRegion(regions);
    setSecondary("");
  }, []);

  const { data: metadata } = useMetadata();

  const { data } = useQuery("region-clustering", () => csv(`${SIMILARITY_API}/api/v1/regions`));

  const [dataByKey, dataByCluster] = useMemo(() => {
    if (!data || !metadata) return [{}, {}];

    const parsedData = data.flatMap((item) => {
      const [country] = item.key!.split(".regions.");
      const flag = get(metadata, [country, "geoId"], "").toLowerCase();

      const parsedItem = {
        key: item.key!,
        area_km: parseFloat(item.area_km || "0"),
        cluster: item.cluster || "",
        days: parseInt(item.days || "0"),
        population: parseFloat(item.population || "0"),
        population_density: parseFloat(item.population_density || "0"),
        ...getByRegionId(metadata, item.key!),
        displayName: getNameByRegionId(metadata, item.key!),
        flag,
      };

      if (parsedItem.days <= 0) {
        return [];
      }

      return parsedItem;
    });

    return [keyBy(parsedData, "key"), groupBy(parsedData, "cluster")];
  }, [data, metadata]);

  const regionFilter = useCallback((key) => !!dataByKey[key], [dataByKey]);

  const currentRegion = useMemo(() => {
    const selectedKey = first(Object.keys(region));
    return selectedKey && dataByKey[selectedKey];
  }, [region, dataByKey]);

  const { data: topSimilarData, status: topSimilarDataStatus } = useQuery(["region-similar", currentRegion?.key], () =>
    currentRegion ? csv(`${SIMILARITY_API}/api/v1/regions/${currentRegion.key}`) : Promise.resolve(null)
  );

  useEffect(() => {
    if (topSimilarDataStatus === "success" && topSimilarData?.length === 0) {
      const timer = setInterval(() => queryCache.refetchQueries(["region-similar", currentRegion?.key], { force: true }), 5000);
      return () => {
        clearInterval(timer);
      };
    }
  }, [currentRegion, data, topSimilarData, topSimilarDataStatus]);

  const [aspect, setAspect] = useState(similarityOptions[0].value);
  const isIncidence = ["cases_per_100k_distance", "deaths_per_100k_distance"].includes(aspect);

  const sortedTopSimilar = useMemo(() => {
    if (!topSimilarData) return [];

    const { days } = currentRegion;
    const maxValue = Math.max(...topSimilarData.map((i) => Number(i[aspect] ?? 0)));

    return orderBy(
      topSimilarData,
      (item) => {
        const region = dataByKey[item.region!];

        if (!region) {
          console.warn("Region not found.", { key: item.region });
          return 0;
        }

        const similarity = 1 - Number(item[aspect] ?? 0) / maxValue;
        const daysFactor = Math.min(1, region.days / days);
        return similarity * daysFactor;
      },
      "desc"
    );
  }, [aspect, currentRegion, dataByKey, topSimilarData]);

  const clusterBuddies = useMemo(() => {
    if (!currentRegion || !topSimilarData) return [];

    return orderBy(dataByCluster[currentRegion.cluster], (item) => dataByKey[item.key]?.displayName);
  }, [currentRegion, dataByCluster, dataByKey, topSimilarData]);

  const secondaryRegion = useMemo(() => {
    if (sortedTopSimilar && !secondary) {
      return dataByKey[first(sortedTopSimilar)?.region!];
    }
    return secondary && dataByKey[secondary];
  }, [dataByKey, secondary, sortedTopSimilar]);

  const chartRegions = useMemo(() => {
    if (!currentRegion || !secondaryRegion) {
      return {};
    }

    return { [currentRegion.key]: true, [secondaryRegion.key]: true };
  }, [currentRegion, secondaryRegion]);

  if (!data || !metadata) {
    return (
      <div style={{ height: "350px", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Loader active inline />
      </div>
    );
  }

  const regionSelector = (
    <div style={{ width: "100%", maxWidth: "350px", margin: "0 auto" }}>
      <RegionSelector value={region} onChange={setSelectedRegions} multiple={false} filter={regionFilter} />
    </div>
  );

  if (!currentRegion) {
    return (
      <div style={{ padding: "0 20px" }}>
        <Segment placeholder>
          <Header icon>
            <Icon name="search" />
            Find Region
          </Header>
          {regionSelector}
        </Segment>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 20px" }}>
      {regionSelector}

      {topSimilarData && topSimilarData.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 450px" }}>
          <div style={{ padding: 10 }}>
            <Segment>
              <Grid columns={2}>
                <Grid.Column>
                  <Header as="h3">
                    <Flag name={currentRegion?.flag} /> {currentRegion?.displayName}
                  </Header>
                  <Statistic.Group horizontal>
                    <Statistic>
                      <Statistic.Value>{displayNumberFormatter(currentRegion?.population)}</Statistic.Value>
                      <Statistic.Label>Population</Statistic.Label>
                    </Statistic>
                    <Statistic>
                      <Statistic.Value>{displayNumberFormatter(currentRegion?.area_km)}</Statistic.Value>
                      <Statistic.Label>km²</Statistic.Label>
                    </Statistic>
                    <Statistic>
                      <Statistic.Value>{currentRegion?.days}</Statistic.Value>
                      <Statistic.Label>Days since first case</Statistic.Label>
                    </Statistic>
                  </Statistic.Group>
                </Grid.Column>
                <Grid.Column>
                  <Header as="h3">
                    <Flag name={secondaryRegion?.flag} />
                    {secondaryRegion?.displayName}
                  </Header>
                  <Statistic.Group horizontal>
                    <Statistic>
                      <Statistic.Value>
                        <DiffIndicator primaryValue={currentRegion?.population} secondaryValue={secondaryRegion?.population} />{" "}
                        {displayNumberFormatter(secondaryRegion?.population)}
                      </Statistic.Value>
                      <Statistic.Label>Population</Statistic.Label>
                    </Statistic>
                    <Statistic>
                      <Statistic.Value>
                        <DiffIndicator primaryValue={currentRegion?.area_km} secondaryValue={secondaryRegion?.area_km} /> {displayNumberFormatter(secondaryRegion?.area_km)}
                      </Statistic.Value>
                      <Statistic.Label>km²</Statistic.Label>
                    </Statistic>
                    <Statistic>
                      <Statistic.Value>
                        <DiffIndicator primaryValue={currentRegion?.days} secondaryValue={secondaryRegion?.days} /> {secondaryRegion?.days}
                      </Statistic.Value>
                      <Statistic.Label>Days since first case</Statistic.Label>
                    </Statistic>
                  </Statistic.Group>
                </Grid.Column>
              </Grid>
            </Segment>
            <Segment>
              <CustomizableChart
                {...DEFAULT_OPTIONS}
                selectedRegions={chartRegions}
                alignAt={1}
                chartType="bar"
                isCumulative={true}
                height={250}
                metric={"cases"}
                title={`Comparative between ${currentRegion?.displayName} and ${secondaryRegion?.displayName}`}
                timeserieSlice={-1}
                isIncidence={isIncidence}
                getPopulation={(key) => dataByKey[key].population}
              />
            </Segment>
            <Segment>
              <CustomizableChart
                {...DEFAULT_OPTIONS}
                selectedRegions={chartRegions}
                alignAt={1}
                chartType="bar"
                isCumulative={true}
                height={250}
                metric={"deaths"}
                title={`Comparative between ${currentRegion?.displayName} and ${secondaryRegion?.displayName}`}
                timeserieSlice={-1}
                isIncidence={isIncidence}
                getPopulation={(key) => dataByKey[key].population}
              />
            </Segment>
            <Segment>
              <TrendChart
                {...DEFAULT_OPTIONS}
                selectedRegions={chartRegions}
                alignAt={1}
                height={250}
                metric={"cases"}
                title={`Trend comparative between ${currentRegion?.displayName} and ${secondaryRegion?.displayName}`}
              />
            </Segment>
          </div>

          <div style={{ padding: 10 }}>
            <Segment>
              <Header as="h3">
                Top-similar by <Dropdown inline onChange={(_: any, { value }: any) => setAspect(value)} options={similarityOptions} defaultValue={aspect} />
                <Header.Subheader>Regions with similar epidemiological timeline</Header.Subheader>
              </Header>
              <div style={{ maxHeight: "250px", overflow: "auto" }}>
                <List relaxed>
                  {sortedTopSimilar?.slice(0, 99).map((r, idx) => (
                    <List.Item
                      href="#"
                      onClick={(evt) => {
                        evt.preventDefault();
                        setSecondary(r.region!);
                      }}
                      key={r.region}
                    >
                      <div>
                        <span style={{ display: "inline-block", opacity: 0.8, color: "rgba(0,0,0,.87)", width: "20px", marginRight: 5 }}>{idx + 1}</span>
                        <Flag name={dataByKey[r.region!].flag} />
                        {getNameByRegionId(metadata, r.region!)}
                        {r.is_same_cluster === "True" && (
                          <>
                            {" "}
                            <Popup
                              basic
                              inverted
                              trigger={<Icon name="star" color="yellow" />}
                              content={`${getNameByRegionId(metadata, r.region!)} has similar attributes when compared with ${currentRegion.displayName}`}
                            />
                          </>
                        )}
                      </div>
                    </List.Item>
                  ))}
                </List>
              </div>

              <Header as="h3">
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
              </div>
            </Segment>
          </div>
        </div>
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

function DiffIndicator({ primaryValue, secondaryValue }: { primaryValue: number; secondaryValue: number }) {
  if (primaryValue === secondaryValue) {
    return <Icon name="minus" color="grey" />;
  }

  const diff = primaryValue - secondaryValue;
  const isHugeDiff = Math.abs(diff) > secondaryValue || Math.abs(diff) > primaryValue;

  return <Icon name={`angle ${isHugeDiff ? "double" : ""} ${diff > 0 ? "down" : "up"}` as any} color={diff > 0 ? "red" : "green"} />;
}

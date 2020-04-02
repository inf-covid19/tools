import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Checkbox, Form, Grid, Header, Icon, Image, Segment, Select } from "semantic-ui-react";
import { DEFAULT_OPTIONS, DEFAULT_COUNTRIES } from "../constants";
import "./Editor.css";
import CustomizableChart from "./CustomizableChart";
import useMetadata from "../hooks/useMetadata";

type ChartType = "heatmap" | "bar" | "area" | "line";
type MetricType = "cases" | "deaths";
type SelectedCountriesMap = Record<string, boolean>;
export type ChartOptions = {
  chartType: ChartType;
  metric: MetricType;
  isCumulative: boolean;
  alignAt: number;
  showDataLabels: boolean;
  title: string;
  dayInterval: number;
  selectedRegions: SelectedCountriesMap;
};

const SAVED_CHARTS_KEY = "covid19-tools.editor.savedCharts.v2";
const DEFAULTS_KEY = "covid19-tools.editor.defaults.v2";

function getSavedCharts(
  id?: string
): Array<
  {
    dataURI: string;
  } & ChartOptions
> {
  if (localStorage.hasOwnProperty(`${SAVED_CHARTS_KEY}${id ? `.${id}` : ""}`)) {
    const savedChartsJSON = localStorage.getItem(`${SAVED_CHARTS_KEY}${id ? `.${id}` : ""}`);
    if (savedChartsJSON) {
      return JSON.parse(savedChartsJSON).map((savedChart: any) => {
        if (savedChart.hasOwnProperty("selectedCountries")) {
          savedChart.selectedRegions = savedChart.selectedCountries;
          delete savedChart.selectedCountries;
        }
        return savedChart;
      });
    }
  }
  return [];
}

const getDefaultsValues = (id?: string): ChartOptions => {
  const defaults = {
    ...DEFAULT_OPTIONS,
    selectedRegions: Object.fromEntries(DEFAULT_COUNTRIES.map(k => [k, true])),
  };

  if (localStorage.hasOwnProperty(`${DEFAULTS_KEY}${id ? `.${id}` : ""}`)) {
    const savedChartsJSON = localStorage.getItem(`${DEFAULTS_KEY}${id ? `.${id}` : ""}`);
    if (savedChartsJSON) {
      const parsedDefaults = JSON.parse(savedChartsJSON);
      if (parsedDefaults.hasOwnProperty("selectedCountries")) {
        parsedDefaults.selectedRegions = parsedDefaults.selectedCountries;
        delete parsedDefaults.selectedCountries;
      }
      return {
        ...defaults,
        ...parsedDefaults,
      };
    }
  }

  return defaults as ChartOptions;
};

type EditorProps = {
  id?: string;
  availableOptions: Array<keyof ChartOptions>;
  render: (ref: React.MutableRefObject<any>, options: ChartOptions) => React.ReactNode;
};

function Editor(props: EditorProps) {
  const { id, availableOptions } = props;

  const defaultsValues = useMemo(() => getDefaultsValues(props.id), [props.id]);

  const [savedCharts, setSavedCharts] = useState(getSavedCharts(props.id));

  const chartRef = useRef<any>(null);
  const [chartType, setChartType] = useState(defaultsValues.chartType);
  const [metric, setMetric] = useState(defaultsValues.metric);
  const [alignAt, setAlignAt] = useState(defaultsValues.alignAt);
  const [isCumulative, setIsCumulative] = useState(defaultsValues.isCumulative);
  const [showDataLabels, setShowDataLabels] = useState(defaultsValues.showDataLabels);
  const [title, setTitle] = useState(defaultsValues.title);
  const [dayInterval, setDayInterval] = useState(defaultsValues.dayInterval);
  const [selectedRegions, setSelectedRegions] = useState(defaultsValues.selectedRegions);
  const [saved, setSaved] = useState(false);
  const { data: metadata } = useMetadata();

  const regionsOptions = Object.entries(metadata).flatMap(([country, countryData]) => {
    const countryName = countryData.name.replace(/_/g, " ");
    return [
      {
        key: country,
        value: country,
        text: countryName,
      },
      ...Object.entries(countryData.regions as Record<string, any>).map(([key, regionData]) => ({
        key: `${country}.regions.${key}`,
        text: `${regionData.name}${regionData.parent ? `, ${regionData.parent}` : ""}, ${countryName}`,
        value: `${country}.regions.${key}`,
      })),
    ];
  });

  const selectedRegionOptions = useMemo(() => Object.keys(selectedRegions).filter(k => selectedRegions[k]), [selectedRegions]);

  useEffect(() => {
    localStorage.setItem(`${SAVED_CHARTS_KEY}${id ? `.${id}` : ""}`, JSON.stringify(savedCharts));
  }, [id, savedCharts]);

  useEffect(() => {
    localStorage.setItem(
      `${DEFAULTS_KEY}${id ? `.${id}` : ""}`,
      JSON.stringify({ metric, isCumulative, showDataLabels, title, dayInterval, selectedCountries: selectedRegions, alignAt, chartType })
    );
  }, [id, metric, isCumulative, showDataLabels, title, dayInterval, selectedRegions, alignAt, chartType]);

  useEffect(() => {
    let cancelled = false;
    if (saved) {
      setTimeout(() => {
        if (cancelled) return;
        setSaved(false);
      }, 3000);
    }
    return () => {
      cancelled = true;
    };
  }, [saved]);

  return (
    <div>
      <Grid padded>
        <Grid.Row>
          <Grid.Column width={12}>
            <Segment>
              {props.render(chartRef, {
                chartType,
                isCumulative,
                title,
                metric,
                showDataLabels,
                dayInterval,
                selectedRegions,
                alignAt,
              })}
            </Segment>
          </Grid.Column>
          <Grid.Column width={4}>
            <Segment style={{ height: "100%" }}>
              <Form>
                <Header>Options</Header>

                {availableOptions.includes("title") && (
                  <Form.Field>
                    <label>Title</label>
                    <input placeholder="Enter a title" type="text" defaultValue={title} onBlur={({ target }: any) => setTitle(target.value)} />
                  </Form.Field>
                )}

                {availableOptions.includes("chartType") && (
                  <Form.Select
                    label="Choose chart type"
                    value={chartType}
                    onChange={(_, { value }) => setChartType(value as ChartType)}
                    options={[
                      { key: "heatmap", text: "Heatmap", value: "heatmap" },
                      { key: "line", text: "Line", value: "line" },
                      { key: "area", text: "Area", value: "area" },
                      { key: "bar", text: "Bar", value: "bar" },
                    ]}
                  />
                )}

                {availableOptions.includes("isCumulative") && (
                  <Form.Select
                    label="Choose total or daily values"
                    value={isCumulative ? "total" : "daily"}
                    onChange={(_, { value }) => setIsCumulative(value === "total")}
                    options={[
                      { key: "total", text: "Total", value: "total" },
                      { key: "daily", text: "Daily", value: "daily" },
                    ]}
                  />
                )}
                {availableOptions.includes("metric") && (
                  <Form.Select
                    label="Choose cases or deaths"
                    value={metric}
                    onChange={(_, { value }) => setMetric(value as MetricType)}
                    options={[
                      { key: "cases", text: "Cases", value: "cases" },
                      { key: "deaths", text: "Deaths", value: "deaths" },
                    ]}
                  />
                )}

                {availableOptions.includes("alignAt") && (
                  <Form.Field>
                    <label>Minimum number of {metric} to align timeline</label>
                    <input type="number" placeholder="Enter a number" min="0" defaultValue={alignAt} onBlur={({ target }: any) => setAlignAt(parseInt(target.value) || 0)} />
                  </Form.Field>
                )}

                {availableOptions.includes("dayInterval") && (
                  <Form.Field disabled={alignAt > 0}>
                    <label>How many past days would you like to see?</label>
                    <input
                      type="number"
                      placeholder="Enter a number"
                      min="0"
                      defaultValue={dayInterval}
                      onBlur={({ target }: any) => setDayInterval(parseInt(target.value) || dayInterval)}
                    />
                  </Form.Field>
                )}

                {availableOptions.includes("selectedRegions") && (
                  <Form.Field
                    control={Select}
                    searchInput={{ id: "editor-countries-select" }}
                    clearable
                    label={{ children: "Choose regions (click to add more)", htmlFor: "editor-countries-select" }}
                    value={selectedRegionOptions}
                    onChange={(_: any, { value }: any) =>
                      setSelectedRegions(curr => {
                        const next = { ...curr };
                        const invertedIndex = Object.fromEntries((value as string[]).map(k => [k, true]));
                        Object.keys({ ...next, ...invertedIndex }).forEach(k => {
                          next[k] = invertedIndex[k] || false;
                        });
                        return next;
                      })
                    }
                    search
                    multiple
                    options={regionsOptions}
                  />
                )}

                {availableOptions.includes("showDataLabels") && (
                  <Form.Field>
                    <Checkbox toggle checked={showDataLabels} onChange={() => setShowDataLabels(!showDataLabels)} label="Show data labels" />
                  </Form.Field>
                )}
                <Button
                  positive={saved}
                  onClick={() => {
                    chartRef.current?.chart.dataURI().then(({ imgURI }: any) => {
                      const newSavedCharts = [
                        ...savedCharts,
                        {
                          dataURI: imgURI,
                          alignAt,
                          metric,
                          title,
                          isCumulative,
                          selectedRegions,
                          dayInterval,
                          showDataLabels,
                          chartType,
                        },
                      ];
                      setSavedCharts(newSavedCharts);
                      setSaved(true);
                    });
                  }}
                >
                  {saved ? "Saved" : "Save"}
                </Button>
              </Form>
            </Segment>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={16}>
            <Segment placeholder={savedCharts.length === 0}>
              {savedCharts.length > 0 ? (
                <Fragment>
                  <Header as="h3">Saved Charts</Header>
                  <div className="Editor--saved-charts--container">
                    {savedCharts.map((item, index) => {
                      return (
                        <Card key={`${index}-${item.title}`} className="Editor--saved-charts--container--card">
                          <Image className="Editor--saved-charts--container--card--image" alt={item.title} wrapped ui={false} src={item.dataURI} />
                          <Card.Content>
                            <Card.Header>{item.title}</Card.Header>
                            <Card.Meta>{`${item.isCumulative ? "Total" : "Daily"} number of ${item.metric}`}</Card.Meta>
                          </Card.Content>
                          <Card.Content extra>
                            <span className="right floated">Past {item.dayInterval} days</span>

                            <Icon name="map marker" />
                            {`${Object.keys(item.selectedRegions).filter(k => item.selectedRegions[k]).length} regions`}
                          </Card.Content>

                          <Button.Group widths="2" attached="bottom">
                            <Button
                              primary
                              onClick={() => {
                                setMetric(item.metric);
                                setIsCumulative(item.isCumulative);
                                setShowDataLabels(item.showDataLabels);
                                setTitle(item.title);
                                setDayInterval(item.dayInterval);
                                setSelectedRegions(item.selectedRegions);
                                setAlignAt(item.alignAt || 0);
                                setChartType(item.chartType || "heatmap");
                                window.scrollTo(0, 0);
                              }}
                            >
                              Load
                            </Button>

                            <Button
                              onClick={() => {
                                setSavedCharts(savedCharts.filter((_, idx) => index !== idx));
                              }}
                            >
                              Remove
                            </Button>
                          </Button.Group>
                        </Card>
                      );
                    })}
                  </div>
                </Fragment>
              ) : (
                <Header icon>
                  <Icon name="save outline" />
                  No charts were saved yet.
                </Header>
              )}
            </Segment>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </div>
  );
}
export default Editor;

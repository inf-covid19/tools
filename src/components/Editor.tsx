import React, { Fragment, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Button, Card, Checkbox, Container, Form, Grid, Header, Icon, Image, Segment } from "semantic-ui-react";
import { DEFAULT_COUNTRIES, DEFAULT_OPTIONS } from "../constants";
import "./Editor.css";
import RegionSelector from "./RegionSelector";
import { omit } from "lodash";
import ExportChart from "./ExportChart";

type ScaleType = "linear" | "log";
type ChartType = "heatmap" | "bar" | "area" | "line" | "scatter";
type MetricType = "cases" | "deaths";
type ProjectionType = "tsne" | "umap";
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
  scale: ScaleType;
  predictionDays: number;
  projectionType: ProjectionType;
  epsilon: number;
  perplexity: number;
  iterations: number;
  timeserieSlice: number;
  spread: number;
  neighbors: number;
  minDist: number;
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
    selectedRegions: Object.fromEntries(DEFAULT_COUNTRIES.map((k) => [k, true])),
  };

  if (localStorage.hasOwnProperty(`${DEFAULTS_KEY}${id ? `.${id}` : ""}`)) {
    const savedChartsJSON = localStorage.getItem(`${DEFAULTS_KEY}${id ? `.${id}` : ""}`);
    if (savedChartsJSON) {
      const parsedDefaults = JSON.parse(savedChartsJSON);
      if (parsedDefaults.hasOwnProperty("selectedCountries")) {
        parsedDefaults.selectedRegions = parsedDefaults.selectedCountries;
        delete parsedDefaults.selectedCountries;
      }

      Object.entries(parsedDefaults.selectedRegions).forEach(([key, enabled]) => {
        if (!enabled) {
          delete parsedDefaults.selectedRegions[key];
        }
      });

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

  const [options, setOptions] = useState(defaultsValues);

  const {
    chartType,
    metric,
    scale,
    alignAt,
    isCumulative,
    showDataLabels,
    title,
    dayInterval,
    selectedRegions,
    predictionDays,
    projectionType,
    epsilon,
    perplexity,
    iterations,
    timeserieSlice,
    spread,
    neighbors,
    minDist,
  } = options;

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    localStorage.setItem(`${SAVED_CHARTS_KEY}${id ? `.${id}` : ""}`, JSON.stringify(savedCharts));
  }, [id, savedCharts]);

  useEffect(() => {
    localStorage.setItem(`${DEFAULTS_KEY}${id ? `.${id}` : ""}`, JSON.stringify(options));
  }, [id, options]);

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

  const setSelectedRegions = useCallback((regions) => setOptions((opt) => ({ ...opt, selectedRegions: regions })), []);

  return (
    <div>
      {availableOptions.includes("selectedRegions") && (
        <Container>
          <RegionSelector value={selectedRegions} onChange={setSelectedRegions} />
        </Container>
      )}
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
                scale,
                predictionDays,
                epsilon,
                perplexity,
                iterations,
                timeserieSlice,
                projectionType,
                spread,
                neighbors,
                minDist,
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
                    <input placeholder="Enter a title" type="text" defaultValue={title} onBlur={({ target }: any) => setOptions({ ...options, title: target.value })} />
                  </Form.Field>
                )}

                {availableOptions.includes("chartType") && (
                  <Form.Select
                    label="Choose chart type"
                    value={chartType}
                    onChange={(_, { value }) => setOptions({ ...options, chartType: value as ChartType })}
                    options={[
                      { key: "heatmap", text: "Heatmap", value: "heatmap" },
                      { key: "line", text: "Line", value: "line" },
                      { key: "area", text: "Area", value: "area" },
                      { key: "bar", text: "Bar", value: "bar" },
                      { key: "scatter", text: "Scatter", value: "scatter" },
                    ]}
                  />
                )}
                {availableOptions.includes("predictionDays") && (
                  <Form.Field>
                    <label>How many days would you like to predict?</label>
                    <input
                      type="number"
                      placeholder="Enter a number"
                      min="0"
                      defaultValue={predictionDays}
                      onBlur={({ target }: any) => setOptions({ ...options, predictionDays: parseInt(target.value) || 0 })}
                    />
                  </Form.Field>
                )}

                {availableOptions.includes("isCumulative") && (
                  <Form.Select
                    label="Choose total or daily"
                    value={isCumulative ? "total" : "daily"}
                    onChange={(_, { value }) => setOptions({ ...options, isCumulative: value === "total" })}
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
                    onChange={(_, { value }) => setOptions({ ...options, metric: value as MetricType })}
                    options={[
                      { key: "cases", text: "Cases", value: "cases" },
                      { key: "deaths", text: "Deaths", value: "deaths" },
                    ]}
                  />
                )}

                {availableOptions.includes("scale") && (
                  <Form.Select
                    label="Choose linear or logarithmic scale"
                    value={scale}
                    onChange={(_, { value }) => setOptions({ ...options, scale: value as ScaleType })}
                    options={[
                      { key: "linear", text: "Linear", value: "linear" },
                      { key: "log", text: "Logarithmic", value: "log" },
                    ]}
                  />
                )}

                {availableOptions.includes("alignAt") && (
                  <Form.Field>
                    <label>Minimum number of {metric} to align timeline</label>
                    <input
                      type="number"
                      placeholder="Enter a number"
                      min="0"
                      defaultValue={alignAt}
                      onBlur={({ target }: any) => setOptions({ ...options, alignAt: parseInt(target.value) || 0 })}
                    />
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
                      onBlur={({ target }: any) => setOptions({ ...options, dayInterval: parseInt(target.value) || dayInterval })}
                    />
                  </Form.Field>
                )}
                {availableOptions.includes("timeserieSlice") && (
                  <Form.Field>
                    <label>Region vector size</label>
                    <input
                      type="number"
                      placeholder="Enter a number"
                      defaultValue={timeserieSlice}
                      onBlur={({ target }: any) => setOptions({ ...options, timeserieSlice: parseInt(target.value) || 0 })}
                    />
                  </Form.Field>
                )}

                {availableOptions.includes("projectionType") && (
                  <Form.Select
                    label="Choose projection technique"
                    value={projectionType}
                    onChange={(_, { value }) => setOptions({ ...options, projectionType: value as ProjectionType })}
                    options={[
                      { key: "umap", text: "UMAP", value: "umap" },
                      { key: "tsne", text: "t-SNE", value: "tsne" },
                    ]}
                  />
                )}

                {projectionType === "tsne" && (
                  <React.Fragment>
                    {availableOptions.includes("epsilon") && (
                      <Form.Field>
                        <label>t-SNE: epsilon</label>
                        <input
                          type="number"
                          placeholder="Enter a number"
                          defaultValue={epsilon}
                          onBlur={({ target }: any) => setOptions({ ...options, epsilon: parseInt(target.value) || 0 })}
                        />
                      </Form.Field>
                    )}

                    {availableOptions.includes("perplexity") && (
                      <Form.Field>
                        <label>t-SNE: perplexity</label>
                        <input
                          type="number"
                          placeholder="Enter a number"
                          defaultValue={perplexity}
                          onBlur={({ target }: any) => setOptions({ ...options, perplexity: parseInt(target.value) || 0 })}
                        />
                      </Form.Field>
                    )}
                    {availableOptions.includes("iterations") && (
                      <Form.Field>
                        <label>Number of iterations</label>
                        <input
                          type="number"
                          placeholder="Enter a number"
                          defaultValue={iterations}
                          onBlur={({ target }: any) => setOptions({ ...options, iterations: parseInt(target.value) || 0 })}
                        />
                      </Form.Field>
                    )}
                  </React.Fragment>
                )}
                {projectionType === "umap" && (
                  <React.Fragment>
                    {availableOptions.includes("spread") && (
                      <Form.Field>
                        <label>UMAP: spread</label>
                        <input
                          type="number"
                          placeholder="Enter a number"
                          defaultValue={spread}
                          onBlur={({ target }: any) => setOptions({ ...options, spread: parseInt(target.value) || 0 })}
                        />
                      </Form.Field>
                    )}

                    {availableOptions.includes("neighbors") && (
                      <Form.Field>
                        <label>UMAP: neighbors</label>
                        <input
                          type="number"
                          placeholder="Enter a number"
                          defaultValue={neighbors}
                          onBlur={({ target }: any) => setOptions({ ...options, neighbors: parseInt(target.value) || 0 })}
                        />
                      </Form.Field>
                    )}

                    {availableOptions.includes("minDist") && (
                      <Form.Field>
                        <label>UMAP: minDist</label>
                        <input
                          type="number"
                          placeholder="Enter a number"
                          defaultValue={minDist}
                          onBlur={({ target }: any) => setOptions({ ...options, minDist: parseFloat(target.value) || 0 })}
                        />
                      </Form.Field>
                    )}
                  </React.Fragment>
                )}

                {availableOptions.includes("showDataLabels") && (
                  <Form.Field>
                    <Checkbox toggle checked={showDataLabels} onChange={() => setOptions({ ...options, showDataLabels: !showDataLabels })} label="Show data labels" />
                  </Form.Field>
                )}

                <div className="Editor--actions--container">
                  <Button
                    type="button"
                    primary
                    loading={saving}
                    positive={saved}
                    onClick={() => {
                      setSaving(true);
                      chartRef.current?.chart.dataURI().then(({ imgURI }: any) => {
                        const newSavedCharts = [
                          ...savedCharts,
                          {
                            dataURI: imgURI,
                            ...options,
                          },
                        ];
                        setSavedCharts(newSavedCharts);
                        setSaved(true);
                        setSaving(false);
                      });
                    }}
                  >
                    {saved ? "Saved" : "Save"}
                  </Button>

                  <Button type="button" onClick={() => setOptions((opt) => ({ ...opt, ...omit(DEFAULT_OPTIONS, ["selectedRegions"]) } as ChartOptions))}>
                    Reset
                  </Button>

                  <ExportChart title={options.title} metric={options.metric} isCumulative={options.isCumulative} chart={chartRef} />
                </div>
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
                            {`${Object.keys(item.selectedRegions).filter((k) => item.selectedRegions[k]).length} regions`}
                          </Card.Content>

                          <Button.Group widths="2" attached="bottom">
                            <Button
                              primary
                              onClick={() => {
                                setOptions(item);
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

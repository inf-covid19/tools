import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Checkbox, Form, Grid, Header, Icon, Image, Segment } from "semantic-ui-react";
import { DEFAULT_COUNTRIES, DEFAULT_DAY_INTERVAL, DEFAULT_IS_CUMULATIVE, DEFAULT_METRIC, DEFAULT_SHOW_DATA_LABELS, DEFAULT_TITLE } from "../constants";
import { COUNTRIES } from "../countries";
import "./Editor.css";
import HeatmapChart from "./HeatmapChart";

type MetricType = "cases" | "deaths";
type SelectedCountriesMap = Record<string, boolean>;
type Options = { metric: MetricType; isCumulative: boolean; showDataLabels: boolean; title: string; dayInterval: number; selectedCountries: SelectedCountriesMap };

const SAVED_CHARTS_KEY = "covid19-tools.editor.savedCharts";
const DEFAULTS_KEY = "covid19-tools.editor.defaults";

function getSavedCharts(): Array<
  {
    dataURI: string;
  } & Options
> {
  if (localStorage.hasOwnProperty(SAVED_CHARTS_KEY)) {
    const savedChartsJSON = localStorage.getItem(SAVED_CHARTS_KEY);
    if (savedChartsJSON) {
      return JSON.parse(savedChartsJSON);
    }
  }
  return [];
}

const countryOptions = Object.keys(COUNTRIES).map(country => ({
  key: country,
  value: country,
  text: country,
}));

const defaultsValues: Options = (() => {
  const defaults = {
    metric: DEFAULT_METRIC,
    isCumulative: DEFAULT_IS_CUMULATIVE,
    showDataLabels: DEFAULT_SHOW_DATA_LABELS,
    title: DEFAULT_TITLE,
    dayInterval: DEFAULT_DAY_INTERVAL,
    selectedCountries: DEFAULT_COUNTRIES.reduce<SelectedCountriesMap>((acc, curr) => ({ ...acc, [curr]: true }), {}),
  };

  if (localStorage.hasOwnProperty(DEFAULTS_KEY)) {
    const savedChartsJSON = localStorage.getItem(DEFAULTS_KEY);
    if (savedChartsJSON) {
      const parsedDefaults = JSON.parse(savedChartsJSON);
      return {
        ...defaults,
        ...parsedDefaults,
      };
    }
  }

  return defaults;
})();

function App() {
  const [savedCharts, setSavedCharts] = useState(getSavedCharts());

  const chartRef = useRef<any>(null);
  const [metric, setMetric] = useState<MetricType>(defaultsValues.metric);
  const [isCumulative, setIsCumulative] = useState(defaultsValues.isCumulative);
  const [showDataLabels, setShowDataLabels] = useState(defaultsValues.showDataLabels);
  const [title, setTitle] = useState(defaultsValues.title);
  const [dayInterval, setDayInterval] = useState(defaultsValues.dayInterval);
  const [selectedCountries, setSelectedCountries] = useState(defaultsValues.selectedCountries);

  const selectedCountryOptions = useMemo(() => Object.keys(selectedCountries).filter(k => selectedCountries[k]), [selectedCountries]);

  useEffect(() => {
    localStorage.setItem(SAVED_CHARTS_KEY, JSON.stringify(savedCharts));
  }, [savedCharts]);

  useEffect(() => {
    localStorage.setItem(DEFAULTS_KEY, JSON.stringify({ metric, isCumulative, showDataLabels, title, dayInterval, selectedCountries }));
  }, [metric, isCumulative, showDataLabels, title, dayInterval, selectedCountries]);

  return (
    <div>
      <Grid padded>
        <Grid.Row>
          <Grid.Column width={12}>
            <Segment>
              <HeatmapChart
                ref={chartRef}
                height={600}
                isCumulative={isCumulative}
                title={title}
                metric={metric}
                showDataLabels={showDataLabels}
                dayInterval={dayInterval}
                selectedCountries={selectedCountries}
              />
            </Segment>
          </Grid.Column>
          <Grid.Column width={4}>
            <Segment style={{ height: "100%" }}>
              <Form>
                <Header>Options</Header>
                <Form.Field>
                  <label>Title</label>
                  <input placeholder="Enter a title" type="text" defaultValue={title} onBlur={({ target }: any) => setTitle(target.value)} />
                </Form.Field>

                <Form.Select
                  label="Choose total or daily values"
                  value={isCumulative ? "total" : "daily"}
                  onChange={(_, { value }) => setIsCumulative(value === "total")}
                  options={[
                    { key: "total", text: "Total", value: "total" },
                    { key: "daily", text: "Daily", value: "daily" },
                  ]}
                />

                <Form.Select
                  label="Choose cases or deaths"
                  value={metric}
                  onChange={(_, { value }) => setMetric(value as MetricType)}
                  options={[
                    { key: "cases", text: "Cases", value: "cases" },
                    { key: "deaths", text: "Deaths", value: "deaths" },
                  ]}
                />

                <Form.Field>
                  <label>How many past days would you like to see?</label>
                  <input
                    type="number"
                    placeholder="Enter a number"
                    min="0"
                    defaultValue={dayInterval}
                    onBlur={({ target }: any) => setDayInterval(parseInt(target.value) || dayInterval)}
                  />
                </Form.Field>

                <Form.Select
                  clearable
                  label="Choose countries"
                  value={selectedCountryOptions}
                  onChange={(_, { value }) =>
                    setSelectedCountries(curr => {
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
                  options={countryOptions}
                />

                <Form.Field>
                  <Checkbox toggle checked={showDataLabels} onChange={() => setShowDataLabels(!showDataLabels)} label="Show data labels" />
                </Form.Field>
                <Button
                  onClick={() => {
                    chartRef.current?.chart.dataURI().then(({ imgURI }: any) => {
                      const newSavedCharts = [
                        ...savedCharts,
                        {
                          dataURI: imgURI,
                          metric,
                          title,
                          isCumulative,
                          selectedCountries,
                          dayInterval,
                          showDataLabels,
                        },
                      ];
                      setSavedCharts(newSavedCharts);
                    });
                  }}
                >
                  Save
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
                          <span className="right floated">
       Past {item.dayInterval} days
      </span>
                            
                            <Icon name="map marker" />
                            {`${Object.keys(item.selectedCountries).filter(k => item.selectedCountries[k]).length} regions`}
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
                                setSelectedCountries(item.selectedCountries);
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
export default App;

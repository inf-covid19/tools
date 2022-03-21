import { Container, Form, Button, Grid } from "semantic-ui-react";
import React, { useCallback, useState, useMemo } from "react";
import RegionSelector from "../RegionSelector";
import first from "lodash/first";
import { generatePath, useHistory, useParams } from "react-router-dom";

import RegionChart from "./RegionChart";
import useMetadata from "../../hooks/useMetadata";
import { getByRegionId } from "../../utils/metadata";

const Config = {
  sign_window: {
    label: "Sign Window",
    help: "Used to soft the sign series.",
    default: 5,
  },
  ascend_window: {
    label: "Ascend Window",
    help: "Used to detect ascend periods after window has passed.",
    default: 5,
  },
  descent_window: {
    label: "Descend Window",
    help: "Used to detect descend periods after window has passed.",
    default: 5,
  },
  plateau_window: {
    label: "Plateau Window",
    help: "Used to detect plateau periods after window has passed.",
    default: 5,
  },
  period_min_days: {
    label: "Period Min. Days",
    help: "Minimum number of days required to be a valid wave period.",
    default: 14,
  },
  restart_min_days: {
    label: "Restart Min. Days",
    help: "Minimum number of days required to be have a period restart.",
    default: 7,
  },
};

const SmoothOptions = {
  simple_moving_average: "Simple Moving Average",
  exponential_moving_average: "Exponential Moving Average",
  savgol_filter: "Savgol Filter",
};

const SmoothParamsByFunction = {
  simple_moving_average: {
    window: {
      label: "Size of the moving window",
      default: 7,
      help: "This is the number of observations used for calculating the statistic. Each window will be a fixed size.",
    },
    min_periods: {
      label: "Min. Periods",
      default: 1,
      help: "Minimum number of observations in window required to have a value.",
    },
    closed: {
      label: "Closed on...",
      default: "right",
      help: "Options: ‘right’, ‘left’, ‘both’ or ‘neither’.",
    },
  },
  cumulative_moving_average: {
    min_periods: {
      label: "Min. Periods",
      default: 1,
      help: "Minimum number of observations in window required to have a value.",
    },
  },
  exponential_moving_average: {
    alpha: {
      label: "Smoothing Factor",
      default: 0.1,
      help: "0 < α <= 1",
    },
    min_periods: {
      label: "Min. Periods",
      default: 1,
      help: "Minimum number of observations in window required to have a value.",
    },
  },
  savgol_filter: {
    window_length: {
      label: "Window Length",
      default: 7,
      help: "Must be a positive odd integer.",
    },
    polyorder: {
      label: "Polyorder",
      default: 2,
      help: "The order of the polynomial used to fit the samples.",
    },
    mode: {
      label: "Mode",
      default: "interp",
      help: "Must be ‘mirror’, ‘constant’, ‘nearest’, ‘wrap’ or ‘interp’.",
    },
    cval: {
      label: "Constant",
      help: "Value to fill past the edges of the input if mode is ‘constant’.",
      default: 0.0,
    },
  },
};

function App() {
  const { region: regionKey } = useParams();
  const history = useHistory();

  const region = useMemo(() => (regionKey ? { [regionKey]: true } : {}), [regionKey]);

  const setRegion = useCallback(
    (regions) => {
      history.push({
        pathname: generatePath("/waves-and-measurements/:region?", {
          region: first(Object.keys(regions)) || undefined,
        }),
      });
    },
    [history]
  );

  const [secondRegion, setSecondRegion] = useState({});

  const [config, setConfig] = useState({});

  const [effectiveConfig, setEffectiveConfig] = useState(config);
  const { data: metadata } = useMetadata();

  const regionData = useMemo(() => {
    const [regionId] = Object.keys(region);

    if (!regionId) {
      return null;
    }

    return getByRegionId(metadata, regionId);
  }, [metadata, region]);

  const secondRegionData = useMemo(() => {
    const [regionId] = Object.keys(secondRegion);

    if (!regionId) {
      return null;
    }

    return getByRegionId(metadata, regionId);
  }, [metadata, secondRegion]);

  return (
    <>
      <Container style={{ marginBottom: 20 }}>
        <h5>Select a location</h5>
        <RegionSelector value={region} onChange={setRegion} multiple={false} />
        <h5>Compare with...</h5>
        <RegionSelector value={secondRegion} onChange={setSecondRegion} multiple={false} />
      </Container>
      <Container fluid>
        <Grid padded stackable>
          <Grid.Row>
            <Grid.Column width={4}>
              <div>
                <h3>Configuration</h3>
                <Form
                  onSubmit={(event) => {
                    event.preventDefault();
                    setEffectiveConfig(config);
                  }}
                >
                  {Object.entries(Config).map(([fieldId, fieldConfig]) => (
                    <Form.Field key={fieldId} className="mb-3">
                      <label>{fieldConfig.label}</label>
                      <input
                        value={config[fieldId]}
                        onChange={({ target }) => setConfig({ ...config, [fieldId]: target.value })}
                        defaultValue={fieldConfig.default}
                        placeholder={fieldConfig.default}
                      />
                      {/* <p className="text-muted">{fieldConfig.help}</p> */}
                    </Form.Field>
                  ))}

                  <Form.Field className="mb-3">
                    <label>Smooth Function</label>
                    <select defaultValue="simple_moving_average" value={config.smooth_fn} onChange={({ target }) => setConfig({ ...config, smooth_fn: target.value })}>
                      {Object.entries(SmoothOptions).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Form.Field>

                  {Object.entries(SmoothParamsByFunction[config.smooth_fn ?? "simple_moving_average"]).map(([paramId, paramConfig]) => (
                    <Form.Field key={paramId} className="mb-3">
                      <label>{paramConfig.label}</label>
                      <input
                        value={config.smooth_params?.[paramId]}
                        onChange={({ target }) =>
                          setConfig({
                            ...config,
                            smooth_params: {
                              ...config.smooth_params,
                              [paramId]: target.value,
                            },
                          })
                        }
                        defaultValue={paramConfig.default}
                        placeholder={paramConfig.default}
                      />
                      {/* <p className="text-muted">{paramConfig.help}</p> */}
                    </Form.Field>
                  ))}

                  <Button variant="primary" type="submit">
                    Save
                  </Button>
                </Form>
              </div>
            </Grid.Column>
            <Grid.Column width={12}>
              {regionData && (
                <Grid.Row>
                  <Grid.Column md={12}>
                    <h5>{regionData.displayName} - Daily Confirmed (21d)</h5>
                    <RegionChart
                      key={regionData.key}
                      regionData={regionData}
                      region={regionData.key}
                      secondRegionData={secondRegionData}
                      secondRegion={secondRegionData?.key}
                      attribute={"confirmed_daily_21d"}
                      title="Daily Confirmed (21d)"
                      config={effectiveConfig}
                    />
                  </Grid.Column>
                  <Grid.Column md={12}>
                    <h5>{regionData.displayName} - Daily Deaths (21d)</h5>
                    <RegionChart
                      key={regionData.key}
                      regionData={regionData}
                      region={regionData.key}
                      secondRegionData={secondRegionData}
                      secondRegion={secondRegionData?.key}
                      attribute={"deaths_daily_21d"}
                      title="Daily Deaths (21d)"
                      config={effectiveConfig}
                    />
                  </Grid.Column>
                </Grid.Row>
              )}
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
    </>
  );
}

export default App;

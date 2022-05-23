import React, { useMemo, useState } from "react";
import { Button, Container, Form, Grid } from "semantic-ui-react";
import styled from "styled-components";
import useLocationFromURL from "../../hooks/useLocationFromURL";
import useMetadata from "../../hooks/useMetadata";
import useStorageState from "../../hooks/useStorageState";
import { getByRegionId } from "../../utils/metadata";
import RegionSelector from "../RegionSelector";
import RegionChart from "./RegionChart";

const MethodOptions = {
  linear: "Linear",
  otsu: "Otsu's Thresholding",
};

const LinearConfig = {
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

const Config = {
  linear: LinearConfig,
  otsu: {},
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
  const [, region, setRegion] = useLocationFromURL({
    path: "/waves-and-measurements/:region?",
  });

  const [secondRegion, setSecondRegion] = useState({});

  const [config, setConfig] = useStorageState("autocovsConfig", {});

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
        <RegionSelector value={region} onChange={setRegion} multiple={false} zIndex={15} />
        <h5>Compare with...</h5>
        <RegionSelector value={secondRegion} onChange={setSecondRegion} multiple={false} />
      </Container>
      <Container fluid>
        <Grid padded stackable>
          <Grid.Row>
            <Grid.Column width={2}>
              <div>
                <h3>Configuration</h3>
                <Form
                  onSubmit={(event) => {
                    event.preventDefault();
                    setEffectiveConfig(config);
                  }}
                >
                  <Form.Field className="mb-3">
                    <label>Method</label>
                    <select defaultValue="linear" value={config.method} onChange={({ target }) => setConfig({ ...config, method: target.value })}>
                      {Object.entries(MethodOptions).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Form.Field>

                  {Object.entries(Config[config.method ?? "linear"]).map(([fieldId, fieldConfig]) => (
                    <Form.Field key={fieldId} className="mb-3">
                      <label>{fieldConfig.label}</label>
                      <input
                        value={config[fieldId]}
                        onChange={({ target }) => setConfig({ ...config, [fieldId]: target.value })}
                        defaultValue={fieldConfig.default}
                        placeholder={fieldConfig.default}
                      />
                      <HelpText>{fieldConfig.help}</HelpText>
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
                        onChange={({ target }) => {
                          const isNumber = Number.isFinite(paramConfig.default);

                          return setConfig({
                            ...config,
                            smooth_params: {
                              ...config.smooth_params,
                              [paramId]: isNumber ? Number(target.value) || paramConfig.default : target.value,
                            },
                          });
                        }}
                        defaultValue={paramConfig.default}
                        placeholder={paramConfig.default}
                      />
                      <HelpText>{paramConfig.help}</HelpText>
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
                      attribute={"confirmed_by_100k_daily_7d"}
                      title="Daily Confirmed (21d)"
                      config={effectiveConfig}
                      withInsights
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

const HelpText = styled.p`
  color: rgba(0, 0, 0, 0.6);
`;

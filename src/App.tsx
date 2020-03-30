import * as fns from "date-fns";
import React, { Fragment, useEffect, useState } from "react";
import "./App.css";
import LogoINF from "./assets/ufrgs-inf.png";
import LogoUFRGS from "./assets/ufrgs.png";
import HeatmapChart from "./components/HeatmapChart";
import Loader from "./components/Loader";
import { DATA_SOURCES, DEFAULT_COUNTRIES, DEFAULT_DAY_INTERVAL, DEFAULT_IS_CUMULATIVE, DEFAULT_METRIC, DEFAULT_SHOW_DATA_LABELS, DEFAULT_TITLE } from "./constants";
import { COUNTRIES } from "./countries";
import useLastUpdated from "./hooks/useLastUpdated";

type MetricType = "cases" | "deaths";

function App() {
  const lastUpdated = useLastUpdated();
  const [metric, setMetric] = useState<MetricType>(DEFAULT_METRIC);
  const [isCumulative, setIsCumulative] = useState(DEFAULT_IS_CUMULATIVE);
  const [showDataLabels, setShowDataLabels] = useState(DEFAULT_SHOW_DATA_LABELS);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [dayInterval, setDayInterval] = useState(DEFAULT_DAY_INTERVAL);
  const [selectedCountries, setSelectedCountries] = useState(DEFAULT_COUNTRIES.reduce<Record<string, boolean>>((acc, curr) => ({ ...acc, [curr]: true }), {}));
  const [showSplashScreen, setShowSplashScreen] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setTimeout(() => (!cancelled ? setShowSplashScreen(false) : undefined), 3000);

    return () => {
      cancelled = true;
    };
  }, []);

  if (showSplashScreen) {
    return <Loader />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={LogoUFRGS} height="100" alt="logo UFRGS" />{" "}
        <div style={{ margin: "0 2em" }}>
          <h1>COVID-19 Analysis Tools</h1>
          <p>A set of configurable tools around COVID-19 data.</p>
        </div>
        <img src={LogoINF} height="100" alt="logo UFRGS-INF" />
      </header>
      <div className="container">
        <div id="chart">
          <HeatmapChart height={600} isCumulative={isCumulative} title={title} metric={metric} showDataLabels={showDataLabels} dayInterval={dayInterval} selectedCountries={selectedCountries} />
        </div>
        <div className="App-Toolbar">
          <div
            style={{
              fontWeight: 300,
              fontSize: "2.5vmin",
              marginBottom: "10px",
            }}
          >
            Options
          </div>

          <div className="App-Toolbar--field">
            <div className="App-Toolbar--field--title">Title</div>
            <input type="text" defaultValue={title} onBlur={({ target }) => setTitle(target.value)} />
          </div>

          <div className="App-Toolbar--field">
            <label>
              <input type="checkbox" name="showValues" checked={showDataLabels} onChange={({ target }) => setShowDataLabels(target.checked)} /> <strong>Show data labels</strong>
            </label>
          </div>

          <div className="App-Toolbar--field">
            <label>
              <input type="checkbox" name="isCumulative" checked={isCumulative} onChange={({ target }) => setIsCumulative(target.checked)} /> <strong>Use cumulative values</strong>
            </label>
          </div>
          <div className="App-Toolbar--field">
            <div className="App-Toolbar--field--title">Choose cases or deaths</div>
            <select name="metric" onChange={({ target }) => setMetric(target.value as MetricType)} value={metric}>
              <option value="cases">Cases</option>
              <option value="deaths">Deaths</option>
            </select>
          </div>

          <div className="App-Toolbar--field">
            <div className="App-Toolbar--field--title">How many past days would you like to see?</div>
            <input type="number" name="interval" min={7} max={90} defaultValue={dayInterval} onBlur={({ target }) => setDayInterval(parseInt(target.value) || dayInterval)} />
          </div>
          <div className="App-Toolbar--field">
            <div className="App-Toolbar--field--title">Countries</div>
            <div className="countries">
              {Object.keys(COUNTRIES).map((country: any) => {
                const isSelected = !!selectedCountries[country];
                return (
                  <div key={country}>
                    <label htmlFor={`check-${country}`}>
                      <input
                        id={`check-${country}`}
                        type="checkbox"
                        value={country}
                        checked={isSelected}
                        onChange={() => setSelectedCountries({ ...selectedCountries, [country]: !isSelected })}
                      />
                      {country}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <footer>
        <span>
          Sources:{" "}
          {DATA_SOURCES.map((src: any, index) => (
            <Fragment key={src.url}>
              <a rel="noopener noreferrer" target="_blank" href={src.url}>
                {src.name}
              </a>
              {index < DATA_SOURCES.length - 2 ? ", " : index < DATA_SOURCES.length - 1 ? " and " : ""}
            </Fragment>
          ))}
          . Last updated at {fns.format(lastUpdated, "PPpp")}.
        </span>
      </footer>
    </div>
  );
}
export default App;

import React, { useState, useRef } from "react";
import { DEFAULT_COUNTRIES, DEFAULT_DAY_INTERVAL, DEFAULT_IS_CUMULATIVE, DEFAULT_METRIC, DEFAULT_SHOW_DATA_LABELS, DEFAULT_TITLE } from "../constants";
import { COUNTRIES } from "../countries";
import "./Editor.css";
import HeatmapChart from "./HeatmapChart";
import ListDescriptor from "./ListDescriptor";


type MetricType = "cases" | "deaths";
type SelectedCountriesMap = Record<string, boolean>;

const STORAGE_KEY = "covid19-tools.editor.savedCharts";

const IS_SAVED_CHARTS_ENABLED = true;

function getSavedCharts(): {
  dataURI: string;
  metric: MetricType;
  isCumulative: boolean;
  showDataLabels: boolean;
  title: string;
  dayInterval: number;
  selectedCountries: SelectedCountriesMap;
}[] {
  if (localStorage.hasOwnProperty(STORAGE_KEY)) {
    const savedChartsJSON = localStorage.getItem(STORAGE_KEY);
    if (savedChartsJSON) {
      return JSON.parse(savedChartsJSON);
    }
  }
  return [];
}

function App() {
  const [savedCharts, setSavedCharts] = useState(getSavedCharts());

  const chartRef = useRef<any>(null);
  const [metric, setMetric] = useState<MetricType>(DEFAULT_METRIC);
  const [isCumulative, setIsCumulative] = useState(DEFAULT_IS_CUMULATIVE);
  const [showDataLabels, setShowDataLabels] = useState(DEFAULT_SHOW_DATA_LABELS);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [dayInterval, setDayInterval] = useState(DEFAULT_DAY_INTERVAL);
  const [selectedCountries, setSelectedCountries] = useState(DEFAULT_COUNTRIES.reduce<SelectedCountriesMap>((acc, curr) => ({ ...acc, [curr]: true }), {}));

  return (
    <div>
      <div className="Editor-container">
        <div id="chart">
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
        </div>
        <div className="Editor-Toolbar">
          <div
            style={{
              fontWeight: 300,
              fontSize: "2.5vmin",
              marginBottom: "10px",
            }}
          >
            Options
          </div>

          <div className="Editor-Toolbar--field">
            <div className="Editor-Toolbar--field--title">Title</div>
            <input type="text" defaultValue={title} onBlur={({ target }) => setTitle(target.value)} />
          </div>

          <div className="Editor-Toolbar--field">
            <label>
              <input type="checkbox" name="showValues" checked={showDataLabels} onChange={({ target }) => setShowDataLabels(target.checked)} /> <strong>Show data labels</strong>
            </label>
          </div>

          <div className="Editor-Toolbar--field">
            <label>
              <input type="checkbox" name="isCumulative" checked={isCumulative} onChange={({ target }) => setIsCumulative(target.checked)} /> <strong>Use cumulative values</strong>
            </label>
          </div>
          <div className="Editor-Toolbar--field">
            <div className="Editor-Toolbar--field--title">Choose cases or deaths</div>
            <select name="metric" onChange={({ target }) => setMetric(target.value as MetricType)} value={metric}>
              <option value="cases">Cases</option>
              <option value="deaths">Deaths</option>
            </select>
          </div>

          <div className="Editor-Toolbar--field">
            <div className="Editor-Toolbar--field--title">How many past days would you like to see?</div>
            <input type="number" name="interval" min={7} max={90} defaultValue={dayInterval} onBlur={({ target }) => setDayInterval(parseInt(target.value) || dayInterval)} />
          </div>
          <div className="Editor-Toolbar--field">
            <div className="Editor-Toolbar--field--title" style={{ display: "flex", justifyContent: "space-between" }}>
              Countries
              <a href="#" onClick={() => setSelectedCountries({})}>
                Deselect all
              </a>
            </div>
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
          {IS_SAVED_CHARTS_ENABLED && (
            <button
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
                  setImmediate(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(newSavedCharts)));
                });
              }}
            >
              Save
            </button>
          )}
        </div>
      </div>
      {IS_SAVED_CHARTS_ENABLED && savedCharts.length > 0 && (
        <div>
          <h3>Saved charts</h3>
          <div className="Editor--saved-charts-container">
            {savedCharts.map((item, index) => {
              return (
                <div key={index} className="Editor--saved-charts-container--item">
                  <img
                    alt={item.title}
                    style={{
                      width: "100%",
                      objectFit: "contain",
                    }}
                    src={item.dataURI}
                  ></img>
                  <h5>{item.title}</h5>
                  <div>
                    <div>{item.isCumulative ? `✓ Cumulative ${item.metric}` : `✓ Daily ${item.metric}`}</div>
                    <div>{item.showDataLabels && "✓ Show data labels"}</div>
                    <div>{`✓ Last ${item.dayInterval} days`}</div>
                  </div>
                  <div>
                    <ListDescriptor>{Object.keys(item.selectedCountries).filter(k => item.selectedCountries[k])}</ListDescriptor>
                  </div>
                  <button
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
                  </button>{" "}
                  <a
                    href="#"
                    onClick={e => {
                      e.preventDefault();
                      setSavedCharts(savedCharts.filter((_, idx) => index !== idx));
                    }}
                  >
                    Remove
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
export default App;

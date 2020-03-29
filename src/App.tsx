import React from "react";
import * as d3 from "d3";
import "./App.css";
import Chart from "react-apexcharts";
import * as fns from "date-fns";
import sortBy from "lodash/sortBy";
import last from "lodash/last";
import { COUNTRIES } from "./countries";
import Loader from "./Loader";

const DEFAULT_COUNTRIES = [
  "Brazil",
  "United States of America",
  "United Kingdom",
  "China",
  "Sweden",
  "Spain",
  "Germany",
  "France",
  "Canada",
  "Portugal",
  "Italy",
  "South Korea",
  "Iran",
  "Israel",
  "Netherlands",
  "Peru"
];

class App extends React.Component {
  state = {
    countries: {},
    selectedCountries: {} as any,
    config: {
      metric: "cases",
      isCumulative: false,
      dayInterval: 30
    },
    loading: true,
    options: {
      chart: {
        height: 500,
        type: "heatmap"
      },
      dataLabels: {
        enabled: false
      },
      title: {
        text: "Where are the most new coronavirus cases?"
      },
      plotOptions: {
        heatmap: {
          shadeIntensity: 0.0,
          colorScale: {
            ranges: [
              { from: -1, to: 10, name: "0-10", color: "#efefef" },
              { from: 11, to: 50, name: "11-50", color: "#fff2cc" },
              { from: 51, to: 100, name: "51-100", color: "#f9cb9c" },
              { from: 101, to: 250, name: "101-250", color: "#e69138" },
              { from: 251, to: 500, name: "251-500", color: "#b45f06" },
              { from: 501, to: 1000, name: "501-1000", color: "#ea9999" },
              { from: 1001, to: 5000, name: "1001-5000", color: "#85200c" },
              { from: 5001, to: 999999, name: "> 5001", color: "#000000" }
            ]
          }
        }
      }
    },
    series: []
  };

  updateAllCharts = () => {
    this.setState(
      () => ({
        series: []
      }),
      () => {
        Object.keys(this.state.selectedCountries).forEach(c => {
          if (this.state.selectedCountries[c]) {
            this.updateChart(c);
          }
        });
      }
    );
  };

  updateChart = (country: string) => {
    const { countries, config }: any = this.state;

    const serieInterval = {
      start: fns.subDays(new Date(), config.dayInterval - 1),
      end: new Date()
    };

    const dateSerie = fns.eachDayOfInterval(serieInterval);

    let cumulativeMetric = 0;
    const countryIndex = [...countries[country]]
      .reverse()
      .reduce((acc: any, row: any) => {
        cumulativeMetric += row ? parseInt(row[config.metric]) : 0;
        return {
          ...acc,
          [row.dateRep]: {
            ...row,
            [config.metric]: config.isCumulative
              ? cumulativeMetric
              : parseInt(row[config.metric])
          }
        };
      }, {});

    let prevMetric = 0;
    const timeDataSeries = dateSerie.map((date: any) => {
      const r = countryIndex[fns.format(date, "dd/MM/yyyy")];

      const ret = {
        x: fns.format(date, "dd/MM"),
        y: r ? r[config.metric] : config.isCumulative ? prevMetric : 0
      };
      prevMetric = ret.y;

      return ret;
    });

    this.setState((state: any) => ({
      ...state,
      series: [
        ...state.series,
        {
          name: country,
          data: timeDataSeries
        }
      ]
    }));
  };

  fetchCovidData = (country: any) => {
    return d3
      .csv(
        `https://cdn.jsdelivr.net/gh/inf-covid19/covid19-data@master/data/countries/${COUNTRIES[country]}`
      )
      .then((data: any) => {
        return this.setState(
          (state: any) => ({
            ...state,
            selectedCountries: {
              ...state.selectedCountries,
              [country]: true
            },
            countries: {
              ...state.countries,
              [country]: data
            }
          }),
          () => {
            this.updateChart(country);
          }
        );
      });
  };

  componentDidMount() {
    Promise.all(DEFAULT_COUNTRIES.map(this.fetchCovidData)).then(v => {
      this.setState(() => ({
        loading: false
      }));
    });
  }

  handleCumulativeChange = (e: any) => {
    const { target } = e;
    this.setState(
      ({ config }: any) => ({
        config: {
          ...config,
          isCumulative: target.checked
        }
      }),
      this.updateAllCharts
    );
  };

  handleCountrySelected = (e: any) => {
    const { target } = e;

    const selectedCountry = target.value;
    const { countries } = this.state;

    this.setState(
      ({ selectedCountries }: any) => ({
        selectedCountries: {
          ...selectedCountries,
          [target.value]: !selectedCountries[target.value]
        }
      }),
      () => {
        if (!countries.hasOwnProperty(selectedCountry)) {
          this.fetchCovidData(selectedCountry);
        }
      }
    );
  };

  render() {
    const { options, series, config, selectedCountries, loading } = this.state;

    if (loading) {
      return <Loader />;
    }

    const sortedSeries = sortBy(
      series.filter((s: any) => !!selectedCountries[s.name]),
      (v: any) => last(v.data as any[]).y
    );

    return (
      <div className="App">
        <header className="App-header">
          <h2>COVID19 Analysis</h2>
          <div className="container">
            <div id="chart">
              <Chart
                options={options}
                series={sortedSeries}
                type="heatmap"
                height={600}
              />
            </div>
            <div className="App-Toolbar">
              <label>
                Is cumulative?
                <input
                  type="checkbox"
                  name="isCumulative"
                  checked={config.isCumulative}
                  onChange={this.handleCumulativeChange}
                />
              </label>
              <br />
              <label>
                Metric:{" "}
                <select
                  name="metric"
                  onChange={({ target }) => {
                    this.setState(
                      ({ config }: any) => ({
                        config: {
                          ...config,
                          metric: target.value
                        }
                      }),
                      this.updateAllCharts
                    );
                  }}
                  value={config.metric}
                >
                  <option value="cases">Cases</option>
                  <option value="deaths">Deaths</option>
                </select>
              </label>
              <br />
              <br />
              <div className="countries">
                {Object.keys(COUNTRIES).map((country: any) => (
                  <div key={country}>
                    <label htmlFor={`check-${country}`}>
                      <input
                        id={`check-${country}`}
                        type="checkbox"
                        value={country}
                        checked={selectedCountries[country] || false}
                        onChange={this.handleCountrySelected}
                      />
                      {country}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>
      </div>
    );
  }
}

export default App;

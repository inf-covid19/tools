import React, { Fragment } from "react";
import * as d3 from "d3";
import "./App.css";
import Chart from "react-apexcharts";
import * as fns from "date-fns";
import sortBy from "lodash/sortBy";
import last from "lodash/last";
import { COUNTRIES } from "./countries";
import Loader from "./Loader";
import LogoUFRGS from "./assets/ufrgs.png";
import LogoINF from "./assets/ufrgs-inf.png";
import { forceManyBody } from "d3";

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

const DATA_SOURCES = [
  {
    name: "ECDC",
    url:
      "https://www.ecdc.europa.eu/en/publications-data/download-todays-data-geographic-distribution-covid-19-cases-worldwide"
  },
  { name: "Brasil.IO", url: "https://brasil.io/dataset/covid19/caso" },
  {
    name: "PHAS",
    url:
      "https://www.folkhalsomyndigheten.se/smittskydd-beredskap/utbrott/aktuella-utbrott/covid-19/aktuellt-epidemiologiskt-lage"
  },
  { name: "NY Times", url: "https://github.com/nytimes/covid-19-data" },
  { name: "ISC", url: "https://covid19.isciii.es/" },
  {
    name: "PHE",
    url:
      "https://www.gov.uk/government/publications/covid-19-track-coronavirus-cases"
  }
];

class App extends React.Component {
  state = {
    lastUpdate: new Date(2020, 2, 29),
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
        text: "Heatmap of Coronavirus Data",
        style: {
          fontSize: "20px"
        }
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
    fetch("https://api.github.com/repos/inf-covid19/tools/branches/master")
      .then(response => {
        response.json().then(json => {
          console.log(json);
          this.setState({
            lastUpdate: new Date(json.commit.commit.author.date)
          });
        });
      })
      .catch(error => {
        console.log(error);
      });
    //
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
    const {
      options,
      series,
      config,
      selectedCountries,
      loading,
      lastUpdate
    } = this.state;

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
          <img src={LogoUFRGS} height="100" alt="logo UFRGS" />{" "}
          <div style={{ margin: "0 2em" }}>
            <h1>COVID-19 Analysis Tools</h1>
            <p>
              A set of configurable tools around COVID-19 data.
              <br />
            </p>
          </div>
          <img src={LogoINF} height="100" alt="logo UFRGS-INF" />
        </header>
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
            <div
              style={{
                fontWeight: 300,
                fontSize: "2.5vmin",
                marginBottom: "10px"
              }}
            >
              Options
            </div>

            <div className="App-Toolbar--field">
              <div className="App-Toolbar--field--title">Title</div>
              <input
                type="text"
                defaultValue={options.title.text}
                onBlur={({ target }) =>
                  this.setState(({ options }: any) => ({
                    options: {
                      ...options,
                      title: {
                        ...options.title,
                        text: target.value
                      }
                    }
                  }))
                }
              />
            </div>

            <div className="App-Toolbar--field">
              <label>
                <input
                  type="checkbox"
                  name="showValues"
                  checked={options.dataLabels.enabled}
                  onChange={({ target }) =>
                    this.setState(({ options }: any) => ({
                      options: {
                        ...options,
                        dataLabels: {
                          ...options.dataLabels,
                          enabled: target.checked
                        }
                      }
                    }))
                  }
                />{" "}
                <strong>Show data labels</strong>
              </label>
            </div>

            <div className="App-Toolbar--field">
              <label>
                <input
                  type="checkbox"
                  name="isCumulative"
                  checked={config.isCumulative}
                  onChange={this.handleCumulativeChange}
                />{" "}
                <strong>Use cumulative values</strong>
              </label>
            </div>
            <div className="App-Toolbar--field">
              <div className="App-Toolbar--field--title">
                Choose cases or deaths
              </div>
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
            </div>

            <div className="App-Toolbar--field">
              <div className="App-Toolbar--field--title">
                How many past days would you like to see?
              </div>
              <input
                type="number"
                name="interval"
                min={7}
                max={90}
                defaultValue={config.dayInterval}
                onBlur={({ target }) =>
                  this.setState(
                    ({ config }: any) =>
                      parseInt(target.value) > 0
                        ? {
                            config: {
                              ...config,
                              dayInterval: target.value
                            }
                          }
                        : undefined,
                    () => this.updateAllCharts()
                  )
                }
              />
            </div>
            <div className="App-Toolbar--field">
              <div className="App-Toolbar--field--title">Countries</div>
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
        </div>
        <footer>
          <span>
            {DATA_SOURCES.map((src: any, index) => (
              <Fragment key={src.url}>
                <a target="_blank" href={src.url}>
                  {src.name}
                </a>
                {index < DATA_SOURCES.length - 2
                  ? ", "
                  : index != DATA_SOURCES.length - 1
                  ? " and "
                  : ""}
              </Fragment>
            ))}
            . Last updated at {fns.format(lastUpdate, "PPpp")}.
          </span>
        </footer>
      </div>
    );
  }
}

export default App;

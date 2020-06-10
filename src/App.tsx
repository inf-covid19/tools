import * as fns from "date-fns";
import React, { useEffect, useMemo } from "react";
import ReactGA from "react-ga";
import { generatePath, Link, Redirect, Route, Switch, useLocation } from "react-router-dom";
import { Container, Header, Icon, Menu, SemanticICONS } from "semantic-ui-react";
import "./App.css";
import LogoINF from "./assets/ufrgs-inf.png";
import LogoUFRGS from "./assets/ufrgs.png";
import ChartEditor from "./components/ChartEditor";
import ListDescriptor from "./components/ListDescriptor";
import Loader from "./components/Loader";
import Metrics from "./components/Metrics/Metrics";
import PredictionsEditor from "./components/PredictionsEditor";
import SimilarityExplorer from "./components/Similarity/Explorer";
import TrendEditor from "./components/TrendEditor";
import { DATA_SOURCES } from "./constants";
import useLastUpdated from "./hooks/useLastUpdated";
import useMetadata from "./hooks/useMetadata";
import Literature from "./components/Literature/Literature";
import BrazilDashboard from "./components/BrazilDashboard/BrazilDashboard";

const LAST_TAB_KEY = "covid19-tools.api.lastTab";

const MENU_ITEMS = [
  {
    name: "Chart Editor",
    path: "/editor",
    component: ChartEditor,
    icon: "pie chart",
  },
  {
    name: "Trend Visualizer",
    path: "/trends",
    component: TrendEditor,
    icon: "chart line",
  },
  {
    name: "Prediction Visualizer",
    path: "/predictions",
    component: PredictionsEditor,
    icon: "chart bar",
  },
  // {
  //   name: "Projection Visualizer",
  //   path: "/projections",
  //   component: ProjectionsEditor,
  //   isBeta: false,
  //   icon: "object ungroup outline",
  // },
  {
    name: "Similarity Explorer",
    path: "/similarity/:region?",
    component: SimilarityExplorer,
    icon: "searchengin",
  },
  {
    name: "Region Metrics",
    path: "/metrics/:region?",
    component: Metrics,
    icon: "dashboard",
  },
  {
    name: "COVID-19 Literature",
    path: "/literature",
    external: "http://coronavis-text-analytics-tool.herokuapp.com",
    icon: "quote left",
  },
  {
    name: "Brazil Dashboard",
    path: "/brazil",
    external: "https://covid19.ufrgs.dev/dashboard/",
    icon: "window restore outline",
  },
];

function App() {
  const lastUpdated = useLastUpdated();
  const lastLocation = useMemo(() => localStorage.getItem(LAST_TAB_KEY) || MENU_ITEMS[0].path, []);

  const { loading } = useMetadata();

  const location = useLocation();

  useEffect(() => {
    localStorage.setItem(LAST_TAB_KEY, location.pathname);
    ReactGA.pageview(location.pathname);
  }, [location]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div>
      <header className="App--header">
        <img src={LogoUFRGS} height="100" alt="Universidade Federal do Rio Grande do Sul (UFRGS)" />{" "}
        <div style={{ margin: "0 2em" }}>
          <Header as="h1">
            COVID-19 Analysis Tools
            <Header.Subheader>A set of configurable tools around COVID-19 data.</Header.Subheader>
          </Header>
        </div>
        <img src={LogoINF} height="100" alt="Instituto de Informática UFGRS" />
      </header>

      <Container fluid>
        <Menu className="App--menu" pointing secondary icon="labeled">
          {MENU_ITEMS.map((item) =>
            item.external ? (
              <Menu.Item href={item.external} target="_blank" name={item.name}>
                <Icon name={item.icon as SemanticICONS} />
                {item.name}
              </Menu.Item>
            ) : (
              <Route key={item.name} path={item.path}>
                {({ match }) => (
                  <Menu.Item as={Link} to={generatePath(item.path)} name={item.name} active={!!match}>
                    <Icon name={item.icon as SemanticICONS} />
                    {item.name}
                  </Menu.Item>
                )}
              </Route>
            )
          )}
        </Menu>

        <Switch>
          {MENU_ITEMS.filter((item) => item.component).map((item) => (
            <Route key={item.name} path={item.path} component={item.component} />
          ))}
          <Route path="*">
            <Redirect to={lastLocation} />
          </Route>
        </Switch>
      </Container>

      <footer className="App--footer">
        <span>
          Sources:{" "}
          <ListDescriptor>
            {DATA_SOURCES.map((src) => (
              <a key={src.url} rel="noopener noreferrer" target="_blank" href={src.url}>
                {src.name}
              </a>
            ))}
          </ListDescriptor>
          . Last updated at {fns.format(lastUpdated, "PPpp")}.
        </span>
      </footer>
    </div>
  );
}
export default App;

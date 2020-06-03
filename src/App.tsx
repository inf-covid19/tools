import * as fns from "date-fns";
import React, { useEffect, useMemo } from "react";
import ReactGA from "react-ga";
import { generatePath, Link, Redirect, Route, Switch, useLocation } from "react-router-dom";
import { Container, Header, Label, Menu } from "semantic-ui-react";
import "./App.css";
import LogoINF from "./assets/ufrgs-inf.png";
import LogoUFRGS from "./assets/ufrgs.png";
import ChartEditor from "./components/ChartEditor";
import ListDescriptor from "./components/ListDescriptor";
import Loader from "./components/Loader";
import PredictionsEditor from "./components/PredictionsEditor";
import ProjectionsEditor from "./components/ProjectionsEditor";
import Metrics from "./components/Metrics/Metrics";
import SimilarityExplorer from "./components/Similarity/Explorer";
import TrendEditor from "./components/TrendEditor";
import { DATA_SOURCES } from "./constants";
import useLastUpdated from "./hooks/useLastUpdated";
import useMetadata from "./hooks/useMetadata";

const LAST_TAB_KEY = "covid19-tools.api.lastTab";

const MENU_ITEMS = [
  {
    name: "Chart Editor",
    path: "/editor",
    component: ChartEditor,
  },
  {
    name: "Trend Visualizer",
    path: "/trends",
    component: TrendEditor,
  },
  {
    name: "Prediction Visualizer",
    path: "/predictions",
    component: PredictionsEditor,
  },
  {
    name: "Projection Visualizer",
    path: "/projections",
    component: ProjectionsEditor,
    isBeta: false,
  },
  {
    name: "Similarity Explorer",
    path: "/similarity/:region?",
    component: SimilarityExplorer,
    isBeta: false,
  },
  {
    name: "Metrics",
    path: "/metrics/:region?",
    component: Metrics,
    isBeta: true,
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
        <Menu className="App--menu" pointing secondary>
          {MENU_ITEMS.map((item) => (
            <Route key={item.name} path={item.path}>
              {({ match }) => (
                <Menu.Item as={Link} to={generatePath(item.path)} name={item.name} active={!!match}>
                  {item.name}
                  {item.isBeta && <Label color="teal">Beta</Label>}
                </Menu.Item>
              )}
            </Route>
          ))}
        </Menu>

        <Switch>
          {MENU_ITEMS.map((item) => (
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

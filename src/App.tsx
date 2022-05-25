import * as fns from "date-fns";
import React, { useEffect, useMemo } from "react";
import ReactGA from "react-ga";
import { generatePath, Link, Redirect, Route, Switch, useLocation } from "react-router-dom";
import { Container, Header, Icon, Menu, SemanticICONS } from "semantic-ui-react";
import LogoINF from "./assets/ufrgs-inf.png";
import LogoUFRGS from "./assets/ufrgs.png";
import ChartEditor from "./components/ChartEditor";
import ListDescriptor from "./components/ListDescriptor";
import Loader from "./components/Loader";
import Metrics from "./components/Metrics/Metrics";
import SimilarityExplorer from "./components/Similarity/Explorer";
import TrendEditor from "./components/TrendEditor";
import { DATA_SOURCES } from "./constants";
import useLastUpdated from "./hooks/useLastUpdated";
import useMetadata from "./hooks/useMetadata";
import styled from "styled-components";
import first from "lodash/first";

import AutocovsApp from "./components/Autocovs/AutocovsApp";
import StorytellingContainer from "./components/Storytelling/StorytellingContainer";
import SimilarityDebuggerContainer from "./components/SimilarityDebugger/SimilarityDebuggerContainer";

const LAST_TAB_KEY = "covid19-tools.api.lastTab";

const MENU_ITEMS = [
  {
    name: "Data Explorer",
    path: "/data-explorer",
    component: ChartEditor,
    icon: "pie chart",
  },
  {
    name: "Trend Visualizer",
    path: "/trend-visualizer",
    component: TrendEditor,
    icon: "chart line",
  },
  // {
  //   name: "Prediction Visualizer",
  //   path: "/predictions",
  //   component: PredictionsEditor,
  //   icon: "chart bar",
  // },
  // {
  //   name: "Projection Visualizer",
  //   path: "/projections",
  //   component: ProjectionsEditor,
  //   isBeta: false,
  //   icon: "object ungroup outline",
  // },
  {
    name: "Similarity Explorer",
    path: "/similarity-explorer/:region?",
    component: SimilarityExplorer,
    icon: "searchengin",
  },
  {
    name: "Location Inspector",
    path: "/location-inspector/:region?",
    component: Metrics,
    icon: "dashboard",
    external: false,
  },
  {
    name: "Insights Visualizer",
    path: "/insights-visualizer/:region?",
    component: StorytellingContainer,
    icon: "map outline",
    external: false,
  },
  {
    name: "Similarity Visualizer",
    path: "/similarity-debugger/:region?",
    component: SimilarityDebuggerContainer,
    icon: "find",
    external: false,
  },
  {
    name: "Waves Debugger",
    path: "/waves-and-measurements/:region?",
    component: AutocovsApp,
    icon: "sliders horizontal",
    external: false,
  },
  // {
  //   name: "COVID-19 Literature",
  //   path: "/literature",
  //   external: "http://coronavis-text-analytics-tool.herokuapp.com",
  //   icon: "quote left",
  // },
  // {
  //   name: "Brazil Dashboard",
  //   path: "/brazil",
  //   external: "https://covid19.ufrgs.dev/dashboard/",
  //   icon: "window restore outline",
  // },
];

function App() {
  const lastUpdated = useLastUpdated();
  const lastLocation = useMemo(() => localStorage.getItem(LAST_TAB_KEY) || first(MENU_ITEMS)!.path, []);

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
      <TopHeader>
        <img src={LogoUFRGS} height="100" alt="Universidade Federal do Rio Grande do Sul (UFRGS)" />{" "}
        <div>
          <Header as="h1">
            COVID-19 Visual Analytics Tools
            <Header.Subheader>A set of configurable tools around COVID-19 data.</Header.Subheader>
          </Header>
        </div>
        <img src={LogoINF} height="100" alt="Instituto de Informática UFGRS" />
      </TopHeader>

      <Container fluid>
        <MenuStyled pointing secondary icon="labeled">
          {MENU_ITEMS.map((item) =>
            item.external ? (
              <Menu.Item key={item.name} href={item.external} target="_blank" name={item.name}>
                <Icon name={item.icon as SemanticICONS} />
                <span>{item.name}</span>
              </Menu.Item>
            ) : (
              <Route key={item.name} path={item.path}>
                {({ match }) => (
                  <Menu.Item as={Link} to={generatePath(item.path)} name={item.name} active={!!match}>
                    <Icon name={item.icon as SemanticICONS} />
                    <span>{item.name}</span>
                  </Menu.Item>
                )}
              </Route>
            )
          )}
        </MenuStyled>

        <Switch>
          {MENU_ITEMS.filter((item) => item.component).map((item) => (
            <Route key={item.name} path={item.path} component={item.component} />
          ))}
          <Route path="*">
            <Redirect to={lastLocation} />
          </Route>
        </Switch>
      </Container>

      <Footer>
        <span>
          Sources:{" "}
          <ListDescriptor>
            {DATA_SOURCES.map((src) => (
              <a key={src.url} rel="noopener noreferrer" target="_blank" href={src.url}>
                {src.name}
              </a>
            ))}
          </ListDescriptor>
          .<br />
          Last updated at {fns.format(lastUpdated, "PPpp")}.
        </span>
      </Footer>
    </div>
  );
}
export default App;

const TopHeader = styled.header`
  display: flex;
  padding: 0 2em 2em;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex-wrap: wrap;

  > div {
    margin: 2em 2em 1em;
  }

  @media screen and (max-width: 1024px) {
    > div {
      order: -1;
      flex: 1 0 100%;
    }

    img {
      height: 50px;

      &:nth-of-type(1) {
        order: 2;
      }

      &:nth-of-type(2) {
        order: 3;
      }
    }
  }
`;

const MenuStyled = styled(Menu)`
  justify-content: center;

  @media screen and (max-width: 1024px) {
    > .item {
      min-width: unset !important;
      font-size: 0.7em;

      > span {
        display: none;
      }
    }
  }
`;

const Footer = styled.footer`
  text-align: center;
  font-size: 0.8em;
  padding: 2em;
  color: #0d0d0d;
`;

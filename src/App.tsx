import * as fns from "date-fns";
import React, { useState, useEffect } from "react";
import { Container, Header, Menu, Label } from "semantic-ui-react";
import "./App.css";
import LogoINF from "./assets/ufrgs-inf.png";
import LogoUFRGS from "./assets/ufrgs.png";
import ChartEditor from "./components/ChartEditor";
import ListDescriptor from "./components/ListDescriptor";
import Loader from "./components/Loader";
import TrendEditor from "./components/TrendEditor";
import { DATA_SOURCES } from "./constants";
import useLastUpdated from "./hooks/useLastUpdated";
import useMetadata from "./hooks/useMetadata";
import PredictionsEditor from "./components/PredictionsEditor";
import ProjectionsEditor from "./components/ProjectionsEditor";

const LAST_TAB_KEY = "covid19-tools.api.lastTab";

const MENU_ITEMS = [{
  name: 'Chart Editor',
  value: 'editor'
},{
  name: 'Trend Visualizer',
  value: 'trends'
},{
  name: 'Prediction Visualizer',
  value: 'predictions'
},{
  name: 'Projection Visualizer',
  value: 'projections',
  isBeta: true,
}]

function App() {
  const lastUpdated = useLastUpdated();
  const { loading } = useMetadata();
  const [tab, setTab] = useState(localStorage.getItem(LAST_TAB_KEY) || "editor");

  useEffect(() => {
    localStorage.setItem(LAST_TAB_KEY, tab);
  }, [tab]);

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
          {MENU_ITEMS.map(item => (
            <Menu.Item key={item.value} name={item.name} active={tab === item.value} onClick={() => setTab(item.value)}>
              {item.name}
              {item.isBeta && <Label color="teal">Beta</Label>}
            </Menu.Item>
          ))}
        </Menu>

        {tab === "editor" && <ChartEditor />}
        {tab === "trends" && <TrendEditor />}
        {tab === "predictions" && <PredictionsEditor />}
        {tab === "projections" && <ProjectionsEditor />}
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

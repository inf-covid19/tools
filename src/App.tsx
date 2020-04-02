import * as fns from "date-fns";
import React, { useState } from "react";
import { Container, Header, Menu } from "semantic-ui-react";
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

function App() {
  const lastUpdated = useLastUpdated();
  const { loading } = useMetadata();
  const [tab, setTab] = useState("editor");

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
        <Menu className="App--menu"  pointing secondary>
          <Menu.Item name="Chart Editor" active={tab === "editor"} onClick={() => setTab("editor")} />
          <Menu.Item name="Trend Visualizer" active={tab === "trends"} onClick={() => setTab("trends")} />
        </Menu>

        {tab === "editor" && <ChartEditor />}
        {tab === "trends" && <TrendEditor />}
      </Container>

      <footer className="App--footer">
        <span>
          Sources:{" "}
          <ListDescriptor>
            {DATA_SOURCES.map(src => (
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

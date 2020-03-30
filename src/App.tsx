import * as fns from "date-fns";
import React, { Fragment, useEffect, useState } from "react";
import "./App.css";
import LogoINF from "./assets/ufrgs-inf.png";
import LogoUFRGS from "./assets/ufrgs.png";
import Editor from "./components/Editor";
import Loader from "./components/Loader";
import { DATA_SOURCES } from "./constants";
import useLastUpdated from "./hooks/useLastUpdated";
import ListDescriptor from "./components/ListDescriptor";

function App() {
  const lastUpdated = useLastUpdated();
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

      <Editor />

      <footer>
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

import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import ReactGA from "react-ga";
import { ReactQueryConfigProvider } from "react-query";

if (process.env.REACT_APP_GA_TRACKING_CODE) {
  ReactGA.initialize(process.env.REACT_APP_GA_TRACKING_CODE);
  ReactGA.pageview(window.location.pathname + window.location.search);
}

const queryConfig = { refetchAllOnWindowFocus: false };

ReactDOM.render(
  <React.StrictMode>
    <ReactQueryConfigProvider config={queryConfig}>
      <App />
    </ReactQueryConfigProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

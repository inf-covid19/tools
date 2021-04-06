import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import ReactGA from "react-ga";
import { ReactQueryConfigProvider } from "react-query";
import { BrowserRouter as Router, Route } from "react-router-dom";
import { QueryParamProvider } from "use-query-params";

if (process.env.NODE_ENV === "production") {
  ReactGA.initialize(process.env.REACT_APP_GA_TRACKING_CODE!);
}

const queryConfig = { refetchAllOnWindowFocus: false, staleTime: 1000 * 60 * 5 };

ReactDOM.render(
  <React.StrictMode>
    <ReactQueryConfigProvider config={queryConfig}>
      <Router basename={process.env.REACT_APP_BASENAME}>
        <QueryParamProvider ReactRouterRoute={Route}>
          <App />
        </QueryParamProvider>
      </Router>
    </ReactQueryConfigProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

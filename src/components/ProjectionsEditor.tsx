import React, { Fragment } from "react";
import Editor from "./Editor";
import ProjectionsChart from "./ProjectionsChart";

export default function ProjectionsEditor() {
  return (
    <Editor
      id="projections"
      availableOptions={[
        "epsilon",
        "projectionType",
        "spread",
        "neighbors",
        "minDist",
        "perplexity",
        "iterations",
        "timeserieSlice",
        "metric",
        "isCumulative",
        "alignAt",
        "title",
        "selectedRegions",
      ]}
      render={(ref, options) => {
        return (
          <Fragment>
            <ProjectionsChart ref={ref} {...options} height={350} />
          </Fragment>
        );
      }}
    />
  );
}

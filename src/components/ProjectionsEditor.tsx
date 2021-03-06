import React, { Fragment } from "react";
import Editor from "./Editor";
import ProjectionsChart from "./ProjectionsChart";
import CustomizableChart from "./CustomizableChart";

export default function ProjectionsEditor() {
  return (
    <Editor
      id="projections"
      availableOptions={[
        "epsilon",
        "projectionType",
        "chartType",
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
        "showDataLabels",
      ]}
      render={(ref, options) => {
        return (
          <Fragment>
            <ProjectionsChart ref={ref} {...options} alignAt={options.alignAt || 1} showDataLabels={false} height={350} />
            <CustomizableChart
              {...options}
              alignAt={options.alignAt || 1}
              height={Math.max(350, (options.chartType === "heatmap" ? 20 : 0) * Object.keys(options.selectedRegions).length)}
            />
          </Fragment>
        );
      }}
    />
  );
}

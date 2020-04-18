import React from "react";
import Editor from "./Editor";
import ProjectionsChart from "./ProjectionsChart";

export default function ProjectionsEditor() {
  return (
    <Editor
      id="projections"
      availableOptions={["epsilon", "perplexity", "iterations", "timeserieSlice", "metric", "isCumulative", "alignAt", "title", "selectedRegions"]}
      render={(ref, options) => {
        return <ProjectionsChart ref={ref} {...options} height={Math.max(600, 15 * Object.keys(options.selectedRegions).length)} />;
      }}
    />
  );
}

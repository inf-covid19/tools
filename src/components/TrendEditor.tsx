import React from "react";
import TrendChart from "./TrendChart";
import Editor from "./Editor";

export default function TrendEditor() {
  return (
    <Editor
    id="trends"
      availableOptions={["metric", "alignAt", "title", "selectedRegions"]}
      render={(ref, options) => {
        return <TrendChart ref={ref} {...options} height={600} />;
      }}
    />
  );
}

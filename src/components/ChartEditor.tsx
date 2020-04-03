import React from "react";
import Editor from "./Editor";
import CustomizableChart from "./CustomizableChart";

export default function ChartEditor() {
  return (
    <Editor
      availableOptions={["chartType", "metric", "isCumulative", "alignAt", "showDataLabels", "title", "dayInterval", "selectedRegions"]}
      render={(ref, options) => {
        return <CustomizableChart ref={ref} {...options} height={600} />;
      }}
    />
  );
}
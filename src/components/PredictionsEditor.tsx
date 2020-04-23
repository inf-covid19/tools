import React from "react";
import Editor from "./Editor";
import PredictionsChart from "./PredictionsChart";

export default function PredictionsEditor() {
  return (
    <Editor
      id="predictions"
      availableOptions={["chartType", "metric", "showDataLabels", "title", "dayInterval", "selectedRegions", "predictionDays"]}
      render={(ref, options) => {
        return <PredictionsChart ref={ref} {...options} height={Math.max(600, (options.chartType === 'heatmap' ? 20 : 0)  * Object.keys(options.selectedRegions).length)} />;
      }}
    />
  );
}

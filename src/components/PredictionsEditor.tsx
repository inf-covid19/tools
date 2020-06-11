import React from "react";
import Editor from "./Editor";
import PredictionsChart from "./PredictionsChart";

export default function PredictionsEditor() {
  return (
    <Editor
      id="predictions"
      availableOptions={["chartType", "metric", "showDataLabels", "title", "dayInterval", "selectedRegions", "predictionDays", "validatePrediction"]}
      render={(ref, options) => {
        return <PredictionsChart ref={ref} {...options} height={600} />;
      }}
    />
  );
}

import React from "react";
import Editor, { ChartOptions } from "./Editor";
import CustomizableChart from "./CustomizableChart";
import pick from 'lodash/pick';

const AVAILABLE_OPTIONS: Array<keyof ChartOptions> = ["chartType", "metric", "isCumulative", "alignAt", "showDataLabels", "title", "dayInterval", "selectedRegions"]

export default function ChartEditor() {
  return (
    <Editor
      availableOptions={AVAILABLE_OPTIONS}
      render={(ref, options) => {
        return <CustomizableChart ref={ref} {...pick(options, AVAILABLE_OPTIONS)} height={Math.max(600, (options.chartType === 'heatmap' ? 20 : 0) * Object.keys(options.selectedRegions).length)} />;
      }}
    />
  );
}

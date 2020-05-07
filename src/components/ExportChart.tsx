import * as d3 from "d3";
import download from "downloadjs";
import { get, keyBy, uniq } from "lodash";
import React, { useMemo } from "react";
import { Dropdown } from "semantic-ui-react";
import slugify from "slugify";

type Props = {
  title: string;
  metric: string;
  isCumulative: boolean;
  chart: React.RefObject<any>;
};

export default function ExportChart({ chart, title, isCumulative, metric }: Props) {
  const [loading, setLoading] = React.useState(false);

  const fileName = useMemo(() => {
    return slugify(`${title}_${isCumulative ? "total" : "daily"}-${metric}`);
  }, [isCumulative, metric, title]);

  return (
    <Dropdown className="button" text="Export" loading={loading}>
      <Dropdown.Menu direction="left">
        <Dropdown.Item
          text="Export as SVG"
          onClick={() => {
            setLoading(true);

            const paper = chart.current?.chart.paper();
            const svg = paper.svg();
            download(svg, `${fileName}.svg`, "image/svg+xml");

            setLoading(false);
          }}
        />
        <Dropdown.Item
          text="Export as PNG"
          onClick={() => {
            setLoading(true);

            chart.current?.chart.dataURI().then(({ imgURI }: any) => {
              download(imgURI, `${fileName}.png`, "image/png");
              setLoading(false);
            });
          }}
        />
        <Dropdown.Item
          text="Export as CSV"
          onClick={() => {
            setLoading(true);

            const series: { key: string; name: string; data: { x: number; y: number }[] }[] = chart.current?.props?.series;

            const X = uniq(series.flatMap((s) => s.data.map((item) => item.x)));
            const seriesKeyed = series.map((item) => {
              return {
                ...item,
                data: keyBy(item.data, "x"),
              };
            });
            const seriesNames = series.map((item) => item.name);

            const data = [["", ...seriesNames]];

            X?.forEach((x) => {
              data.push([`${x}`, ...seriesKeyed.map((item) => `${get(item.data, [x, "y"], "")}`)]);
            });

            const csv = d3.csvFormatRows(data);
            download(csv, `${fileName}.csv`, "text/csv");

            setLoading(false);
          }}
        />
      </Dropdown.Menu>
    </Dropdown>
  );
}

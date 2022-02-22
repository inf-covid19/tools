import * as d3 from "d3";
import { parseToRgb, readableColor, rgbToColorString } from "polished";
import { useMemo } from "react";

function useColorScale(series: { data: { y: number }[] }[]) {
  const colorScale = useMemo(() => {
    const n = 8;

    const values = series.flatMap((s) => s.data.map(({ y }) => y));
    const maxDomain = Math.max(...values);
    const minDomain = Math.max(1, Math.min(...values));

    const colorscale = (d3 as any).scaleSequentialLog(d3.interpolateGnBu).domain([minDomain, maxDomain]);
    const numscale = d3.scaleLog().domain(colorscale.domain());

    const ticks = numscale.ticks();
    const step = Math.round(ticks.length / Math.min(n, ticks.length));
    const t = ticks.filter((_, idx) => idx % step === 0);

    const ranges = [0, ...t].flatMap((value, index, arr) => {
      const from = index === 0 ? 0 : value + 1;
      const to = arr[index + 1];
      const name = from === 0 ? `<${to + 1}` : to === undefined ? `>${from - 1}` : `${from} - ${to}`;
      const color = rgbToColorString(parseToRgb(colorscale(value)));
      const foreColor = readableColor(color, "#4d4d4d", "#ffffff");

      return {
        from,
        to: to || maxDomain,
        color,
        name,
        foreColor,
      };
    });

    return {
      ranges,
    };
  }, [series]);

  return colorScale;
}

export default useColorScale;

import { useMemo } from "react";
import * as d3 from "d3";
import { rgbToColorString, parseToRgb, meetsContrastGuidelines } from "polished";

function useColorScale(series: { data: { y: number }[] }[]) {
  const colorScale = useMemo(() => {
    const n = 8;

    const values = series.flatMap((s) => s.data.map(({ y }) => y));
    const maxDomain = Math.max(...values);
    const minDomain = Math.max(1, Math.min(...values));

    const colorscale = (d3 as any).scaleSequentialLog(d3.interpolatePuBuGn).domain([minDomain, maxDomain]);
    const numscale = d3.scaleLog().domain(colorscale.domain());

    const ticks = numscale.ticks();
    const step = Math.round(ticks.length / Math.min(n, ticks.length));
    const t = ticks.filter((_, idx) => idx % step === 0);

    const ranges = [0, ...t].flatMap((value, index, arr) => {
      const from = index === 0 ? 0 : value + 1;
      const to = arr[index + 1];
      const name = from === 0 ? `<${to}` : to === undefined ? `>${from}` : `${from} - ${to}`;
      const color = rgbToColorString(parseToRgb(colorscale(value)));
      const foreColor = meetsContrastGuidelines(color, "#4d4d4d").AA ? "#4d4d4d" : "#ffffff";

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

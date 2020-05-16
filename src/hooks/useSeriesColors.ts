import { sum } from "lodash";
import { rgbToColorString } from "polished";
import { useMemo } from "react";

function colorHash(input: string) {
  let seed = sum(Array.from(input).map((_, i) => input.charCodeAt(i) * i));

  const getAdditive = () => Math.round(((Math.abs(Math.sin(++seed) * 100000) % 255) + 125) / 2);

  return rgbToColorString({
    red: getAdditive(),
    green: getAdditive(),
    blue: getAdditive(),
  });
}

function useSeriesColors(series: { key: string; name: string }[]) {
  return useMemo(() => series.map(({ key, name }) => colorHash(`${name}:${key}`)), [series]);
}

export default useSeriesColors;

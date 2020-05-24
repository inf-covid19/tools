import { sum } from "lodash";
import { rgbToColorString } from "polished";
import { useMemo } from "react";
import sortBy from "lodash/sortBy";
import * as d3 from "d3";

function colorHash(input: string) {
  let seed = sum(Array.from(input).map((_, i) => input.charCodeAt(i) * i));

  const getAdditive = () => Math.round(((Math.abs(Math.sin(++seed) * 100000) % 255) + 200) / 2);

  return rgbToColorString({
    red: getAdditive(),
    green: getAdditive(),
    blue: getAdditive(),
  });
}

function useSeriesColors(series: { key: string; name: string }[]) {
  return useMemo(() => {
    const sortedSeries = sortBy(series, "name");

    if (sortedSeries.length <= 10) {
      return sortedSeries.map((_, index) => d3.schemeCategory10[index]);
    }

    return sortedSeries.map(({ key, name }) => colorHash(`${name}:${key}`));
  }, [series]);
}

export default useSeriesColors;

import { schemeCategory10 } from "d3";
import { sum } from "lodash";
import sortBy from "lodash/sortBy";
import toMaterialStyle from "material-color-hash";
import { useMemo } from "react";

function colorHash(input: string) {
  let seed = sum(Array.from(input).map((_, i) => input.charCodeAt(i) * i));

  const shade = ((Math.sin(seed) + 1) * 6) / 3 + (3 - 0); // (V * R2 / R1) + (M2 - M1)
  const { backgroundColor } = toMaterialStyle(input, (Math.round(shade) * 100) as any);

  return backgroundColor;
}

function useSeriesColors(series: { key: string; name: string }[]) {
  return useMemo(() => {
    const sortedSeries = sortBy(series, "name");

    if (sortedSeries.length <= 10) {
      return sortedSeries.map((_, index) => schemeCategory10[index]);
    }

    return sortedSeries.map(({ key, name }) => colorHash(key.split("").reverse().join("")));
  }, [series]);
}

export default useSeriesColors;

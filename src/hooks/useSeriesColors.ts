import { useMemo } from "react";
import toMaterialStyle from "material-color-hash";

// const shades = [100, 200, 300, 400, 500, 600, 700, 800, 900];

function useSeriesColors(series: { key: string; name: string }[]) {
  const seriesColors = useMemo(() => {
    return series.map(({ key, name }) => {
      const style = toMaterialStyle(`${name}:${key}`, 500);
      return style.backgroundColor;
    });
  }, [series]);

  return seriesColors;
}

export default useSeriesColors;

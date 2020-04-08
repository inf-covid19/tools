import { useMemo } from "react";
import toMaterialStyle from "material-color-hash";
import get from "lodash/get";

const shades = [ 100, 200, 300, 400, 500, 600, 700, 800, 900];

function useSeriesColors(series: { key: string; name: string; data: any[] }[]) {
  const seriesColors = useMemo(() => {
    const maxY = Math.max(...series.map(({ data }) => get(data, [data.length - 1, 'y'], 0)));

    return series.map(({ key, name, data }) => {
      const y = get(data, [data.length - 1, 'y'], 0);
      const shade = shades[Math.round((y / maxY) * (shades.length - 1))] || 500;

      const style = toMaterialStyle(`${name}:${key}`, shade as any);
      return style.backgroundColor;
    });
  }, [series]);

  return seriesColors;
}

export default useSeriesColors;

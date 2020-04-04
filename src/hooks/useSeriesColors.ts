import { useMemo } from "react";
import toMaterialStyle from "material-color-hash";
import last from "lodash/last";

const shades = [ 100, 200, 300, 400, 500, 600, 700, 800, 900];

function useSeriesColors(series: { key: string; name: string; data: any[] }[]) {
  const seriesColors = useMemo(() => {
    const maxY = Math.max(...series.map(({ data }) => last(data).y));

    return series.map(({ key, name, data }) => {
      const y = last(data).y;
      const shade = shades[Math.round((y / maxY) * (shades.length - 1))] || 500;

      const style = toMaterialStyle(`${name}:${key}`, shade as any);
      console.log('---useSeriesColors---', key, shade, style.backgroundColor);
      return style.backgroundColor;
    });
  }, [series]);

  console.log(seriesColors);

  return seriesColors;
}

export default useSeriesColors;

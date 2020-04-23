export const getSammonStress = (rawData: any[], reductedData: any[]) => {
  let dx = 0;
  let dy = 0;

  let topSammon = 0;
  let bottomSammon = 0;

  for (let i = 0; i < rawData.length; i++) {
    for (let j = 0; j < rawData.length; j++) {
      const a = rawData[i];
      const b = rawData[j];
      let rawDist = 0;

      for (let d = 0; d < a.length; d++) {
        rawDist += Math.pow(a[d] - b[d], 2);
      }
      dx = Math.sqrt(rawDist);

      const x = reductedData[i];
      const y = reductedData[j];
      let reductedDist = 0;
      for (let d = 0; d < x.length; d++) {
        reductedDist += Math.pow(x[d] - y[d], 2);
      }
      dy = Math.sqrt(reductedDist);

      topSammon += Math.pow(dx - dy, 2);
      bottomSammon += Math.pow(dx, 2);
    }
  }

  return topSammon / bottomSammon;
};

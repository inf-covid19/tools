const normFn = (val: number, min: number, max: number) => (val - min) / (max - min);

const normalize = (matrix: Array<number[]>) => {
  console.log("matrix", matrix);

  let maxValue = matrix[0][0];
  let minValue = matrix[0][0];

  for (let i = 0; i < matrix.length; i++) {
    maxValue = Math.max(...matrix[i], maxValue);
    minValue = Math.min(...matrix[i], minValue);
  }

  const normalizedMatrix = matrix.map((row) => {
    return row.map((value) => normFn(value, minValue, maxValue));
  });

  console.log("normalizedMatrix", normalizedMatrix);
  return normalizedMatrix;
};

export const getSammonStress = (rawData: Array<number[]>, reductedData: Array<number[]>) => {
  let dx = 0;
  let dy = 0;

  let first = 0;
  let second = 0;

  const raw = normalize(rawData);
  const red = normalize(reductedData);
  // const raw = rawData;
  // const red = reductedData;

  console.log("nD");
  console.log(raw);
  console.log("2D");
  console.log(red);

  for (let i = 0; i < raw.length - 1; i++) {
    for (let j = i + 1; j < raw.length; j++) {
      const a = raw[i];
      const b = raw[j];

      let rawDist = 0;
      for (let d = 0; d < a.length; d++) {
        rawDist += Math.pow(a[d] - b[d], 2);
      }
      dx = Math.sqrt(rawDist);

      const x = red[i];
      const y = red[j];

      let reductedDist = 0;
      for (let d = 0; d < x.length; d++) {
        reductedDist += Math.pow(x[d] - y[d], 2);
      }
      dy = Math.sqrt(reductedDist);

      first += dx;
      second += Math.pow(dx - dy, 2) / dx;
    }
  }

  return (1 / first) * second;
};

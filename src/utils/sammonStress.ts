const normalizeMatrix = (matrix: Array<number[]>) => {
  let normMatrix = matrix;

  console.log("originmatrix");
  console.log(matrix);

  for (let i = 0; i < matrix.length; i++) {
    let max = Number.MIN_VALUE;
    let min = Number.MAX_VALUE;
    for (let j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j] > max) max = matrix[i][j];
      if (matrix[i][j] < min) min = matrix[i][j];
    }
    let scale = max - min;
    if (scale === 0) scale = 1;
    for (let j = 0; j < matrix[i].length; j++) {
      normMatrix[i][j] = (matrix[i][j] - min) / scale;
    }
  }
  return normMatrix;
};

const computeDist = (matrix: Array<number[]>, aIndex: number, bIndex: number) => {
  let dist = 0;
  let term;
  for (let i = 0; i < matrix[aIndex].length; i++) {
    let x = matrix[aIndex][i];
    let y = matrix[bIndex][i];
    term = x - y;
    dist += term * term;
  }
  return Math.sqrt(dist);
};

const sammondistnormalized = (rawMatrix: Array<number[]>, reductedMatrix: Array<number[]>) => {
  let scale = 0;
  let dist2D,
    distnD = 0;
  let sammon_dist = 0;
  let num, term;

  // const rawNorm = rawMatrix;
  // const redNorm = reductedMatrix;
  const rawNorm = normalizeMatrix(rawMatrix);
  const redNorm = normalizeMatrix(reductedMatrix);

  for (let i = 0; i < rawNorm.length - 1; i++) {
    for (let j = i + 1; j < rawNorm.length; j++) {
      if (i !== j) {
        distnD = computeDist(rawNorm, i, j);
        dist2D = computeDist(redNorm, i, j);
        if (distnD > 0) {
          scale += distnD;
          num = (distnD - dist2D) * (distnD - dist2D);
          term = num / distnD;
          sammon_dist += term;
        }
      }
    }
  }
  return sammon_dist / scale;
};

// -------------------------------------

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

const nD = [
  [1, 1, 1, 1, 2, 2, 2, 2, 3, 8, 13, 13, 25, 25, 34, 52, 77, 98, 121, 200],
  [1, 1, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 7, 7, 7, 7, 7, 7, 7, 7],
  [27, 27, 27, 44, 44, 59, 59, 59, 59, 59, 59, 59, 59, 59, 59, 59, 59, 63, 80, 216],
  [3, 3, 3, 3, 4, 5, 6, 6, 6, 6, 6, 6, 6, 6, 11, 11, 11, 11, 11, 11],
  [1, 4, 4, 5, 7, 8, 9, 11, 11, 11, 12, 13, 13, 13, 13, 15, 15, 15, 15, 15],
  [2, 5, 18, 28, 43, 61, 95, 139, 245, 388, 593, 978, 1501, 2336, 2922, 3513, 4747, 5823, 6566, 7161],
  [1, 1, 2, 2, 2, 2, 3, 7, 7, 10, 10, 10, 15, 17, 19, 25, 39, 39, 70, 82],
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  [1, 2, 7, 13, 18, 28, 38, 82, 128, 188, 265, 321, 382, 503, 614, 804, 959, 1135, 1413, 1705],
  [1, 1, 7, 9, 11, 17, 22, 38, 43, 71, 86, 117, 145, 234, 263, 318, 363, 395, 416, 558],
  [2, 4, 5, 9, 13, 21, 30, 39, 41, 59, 78, 112, 169, 245, 331, 448, 642, 785, 1020, 1280],
  [1, 1, 1, 1, 2, 2, 3, 4, 4, 4, 4, 7, 12, 15, 15, 16, 18, 23, 24, 24],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2, 2, 2, 3, 3, 4, 4, 8, 8, 9, 9, 9, 9, 9, 9, 9],
  [1, 1, 1, 1, 2, 2, 5, 5, 5, 5, 6, 7, 8, 11, 11, 11, 12, 12, 12, 12],
];
const twoD = [
  [-0.7543550902082845, -0.3758752982941773],
  [0.11000593280173934, 0.9402761816928423],
  [-0.8125558763819709, -0.464615568442498],
  [-0.14029390617191556, 0.8946804162268921],
  [-0.33374361032498406, 0.7774864126785171],
  [0.6576963762418209, -1.9421142623174896],
  [-0.5413465109539262, 0.20538256430918372],
  [0.3504713654113922, 0.651377509490047],
  [0.2596571501904968, -1.7686313406778997],
  [-0.5571511052724499, -1.1746918473704784],
  [0.11469657502900536, -1.7152419248165036],
  [-0.2897666150126748, 0.5520833290101049],
  [0.38974406228506536, 0.6784182348981872],
  [0.4102239170620266, 0.6466058884652295],
  [-0.01998481236940563, 0.938028135778903],
  [-0.04655440185067311, 0.6281866420455849],
];

export const getSammonStress = (rawData: Array<number[]>, reductedData: Array<number[]>) => {
  let dx = 0;
  let dy = 0;

  let first = 0;
  let second = 0;

  return sammondistnormalized(rawData, reductedData);

  // ----

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

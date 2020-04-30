const normalizeMatrix = (matrix: Array<number[]>) => {
  let normMatrix = matrix;

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

export const getSammonStress = (rawData: Array<number[]>, reductedData: Array<number[]>) => {
  return sammondistnormalized(rawData, reductedData);
};

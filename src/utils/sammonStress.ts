import { Matrix } from "ml-matrix";
import * as ml from "ml-distance";
import * as d3 from "d3";

const makeMatrix = (m: number[][]) => {
  const matrix = new Matrix(m);

  const max = matrix.max();
  const min = matrix.min();
  const scaleFn = d3.scaleLinear().range([0, 1]).domain([min, max]);

  matrix.apply((i, j) => matrix.set(i, j, scaleFn(matrix.get(i, j))));

  return matrix;
};

const getDistance = (a: number[], b: number[]) => {
  const distanceFn = ml.distance.euclidean;
  return distanceFn(a, b);
};

// Learn more: https://en.wikipedia.org/wiki/Sammon_mapping
export function getSammonStress(raw: number[][], projection: number[][]) {
  let scale = 0;
  let stress = 0;

  const rawMatrix = makeMatrix(raw);
  const projectionMatrix = makeMatrix(projection);

  const length = rawMatrix.rows;
  for (let i = 0; i < length - 1; i++) {
    for (let j = i + 1; j < length; j++) {
      const dOriginal = getDistance(rawMatrix.getRow(i), rawMatrix.getRow(j));
      if (dOriginal > 0) {
        const dProjection = getDistance(projectionMatrix.getRow(i), projectionMatrix.getRow(j));
        scale += dOriginal;
        stress += Math.pow(dOriginal - dProjection, 2) / dOriginal;
      }
    }
  }

  return (1 / scale) * stress;
}

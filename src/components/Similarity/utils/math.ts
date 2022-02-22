export const median = (raw: number[]) => {
  const arr = [...raw].sort();
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
};

export const sum = (arr: number[]) => arr.reduce((sum, x) => sum + x, 0);

export const average = (arr: number[]) => {
  if (arr.length === 0) return 0;

  return sum(arr) / arr.length;
};

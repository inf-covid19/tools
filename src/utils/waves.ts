import { Matrix, SingularValueDecomposition } from "ml-matrix";

// Browser port of the wave detection in autocovs-server (app/helpers.py, app/otsu.py).
// Parity with Python is checked by waves.test.ts, so keep its odd behavior when changing this.

const DAY_MS = 86400000;
const EPSILON = 2.220446049250313e-16;
const MAX_SAVGOL_WINDOW = 10001;

type Series = number[]; // NaN marks a missing value, as in pandas

export type WavesConfig = {
  target_column: string;
  method?: string;
  smooth_fn?: string;
  smooth_params?: Record<string, unknown>;
  sign_window?: unknown;
  ascend_window?: unknown;
  descent_window?: unknown;
  plateau_window?: unknown;
  period_min_days?: unknown;
  restart_min_days?: unknown;
};

export type FeaturedPeriod = { id: string; order: number; start: number; end: number };

export type FeaturedPeriods = {
  featured_periods: FeaturedPeriod[];
  records: Array<Record<string, number | null>>;
};

// Python's int(): the API declared these as int, so "5.0" and "1e1" were refused and "1_000" was not.
function toInt(name: string, value: unknown, fallback: number) {
  if (value === undefined || value === null) return fallback;
  const parsed = typeof value === "string" && /^\s*[+-]?\d+(_\d+)*\s*$/.test(value) ? Number(value.replace(/_/g, "")) : value;
  if (typeof parsed !== "number" || !Number.isInteger(parsed)) {
    throw new Error(`${name} must be an integer`);
  }
  return parsed;
}

function toFloat(name: string, value: unknown, fallback: number) {
  if (value === undefined || value === null) return fallback;
  const parsed = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof parsed !== "number" || !Number.isFinite(parsed)) {
    throw new Error(`${name} must be a number`);
  }
  return parsed;
}

// numpy.rint and Python's round(): ties go to the even neighbor.
function roundHalfEven(x: number) {
  const floor = Math.floor(x);
  const diff = x - floor;
  if (diff < 0.5) return floor;
  if (diff > 0.5) return floor + 1;
  return floor % 2 === 0 ? floor : floor + 1;
}

function simpleMovingAverage(values: Series, params: Record<string, unknown>): Series {
  const window = toInt("window", params.window, 7);
  const minPeriods = toInt("min_periods", params.min_periods, 1);
  const closed = params.closed === undefined || params.closed === null ? "right" : params.closed;

  if (window < 0) throw new Error("window must be non-negative");
  if (minPeriods < 0 || minPeriods > window) throw new Error(`min_periods ${minPeriods} must be between 0 and window ${window}`);
  if (!["right", "left", "both", "neither"].includes(closed as string)) {
    throw new Error("closed must be 'right', 'left', 'both' or 'neither'");
  }

  const includesStart = closed === "left" || closed === "both";
  const includesEnd = closed === "right" || closed === "both";
  const startOf = (i: number) => Math.max(0, i + 1 - window - (includesStart ? 1 : 0));
  const endOf = (i: number) => Math.max(0, i + 1 - (includesEnd ? 0 : 1));

  // pandas roll_mean: a running sum with separate Kahan compensation for adds and removes. Wave
  // detection compares these values exactly, so a plain sum over each window would move periods.
  let sum = 0;
  let addCompensation = 0;
  let removeCompensation = 0;
  let count = 0;

  const add = (value: number) => {
    count += 1;
    const y = value - addCompensation;
    const t = sum + y;
    addCompensation = t - sum - y;
    sum = t;
  };
  const remove = (value: number) => {
    count -= 1;
    const y = -value - removeCompensation;
    const t = sum + y;
    removeCompensation = t - sum - y;
    sum = t;
  };

  return values.map((_, i) => {
    const start = startOf(i);
    const end = endOf(i);
    if (i === 0 || start >= endOf(i - 1)) {
      sum = 0;
      addCompensation = 0;
      removeCompensation = 0;
      count = 0;
      for (let j = start; j < end; j++) add(values[j]);
    } else {
      for (let j = startOf(i - 1); j < start; j++) remove(values[j]);
      for (let j = endOf(i - 1); j < end; j++) add(values[j]);
    }
    return count > 0 && count >= minPeriods ? sum / count : NaN;
  });
}

function exponentialMovingAverage(values: Series, params: Record<string, unknown>): Series {
  const alpha = toFloat("alpha", params.alpha, 0.1);
  // pandas uses max(int(min_periods), 1), so fractions and negatives are fine here.
  const minPeriods = Math.max(Math.trunc(toFloat("min_periods", params.min_periods, 1)), 1);

  if (!(alpha > 0 && alpha <= 1)) throw new Error("alpha must satisfy 0 < alpha <= 1");

  // pandas ewma with adjust=False. The inputs have no NaN since they passed the > 0 filter.
  // It converts alpha to a center of mass and back, which does not always round trip to the same bits.
  const com = (1 - alpha) / alpha;
  const newWeight = 1 / (1 + com);
  const oldFactor = 1 - newWeight;
  let weighted = NaN;
  return values.map((value, i) => {
    if (i === 0) {
      weighted = value;
    } else if (weighted !== value) {
      weighted = (oldFactor * weighted + newWeight * value) / (oldFactor + newWeight);
    }
    return i + 1 >= minPeriods ? weighted : NaN;
  });
}

// LAPACK gelsd as scipy and numpy call it: minimum norm least squares, dropping singular values
// below rcond * largest. The cutoff decides the result at high polynomial orders.
function leastSquares(a: Matrix, b: number[], rcond: number) {
  const svd = new SingularValueDecomposition(a, { autoTranspose: true });
  const u = svd.leftSingularVectors;
  const v = svd.rightSingularVectors;
  const singular = svd.diagonal;
  const cutoff = rcond * singular[0];

  const solution = new Array(a.columns).fill(0);
  singular.forEach((value, k) => {
    if (value <= cutoff) return;
    const projection = u.getColumn(k).reduce((sum, x, i) => sum + x * b[i], 0) / value;
    for (let j = 0; j < a.columns; j++) solution[j] += v.get(j, k) * projection;
  });
  return solution;
}

// numpy.polyfit over x = 0..n-1 followed by numpy.polyval at xs.
function polyfitEvaluate(ys: Series, order: number, xs: number[]) {
  const vander = new Matrix(ys.map((_, x) => Array.from({ length: order + 1 }, (__, p) => Math.pow(x, order - p))));
  const scales = Array.from({ length: order + 1 }, (_, p) => Math.sqrt(vander.getColumn(p).reduce((sum, x) => sum + x * x, 0)));
  const scaled = new Matrix(vander.to2DArray().map((row) => row.map((x, p) => x / scales[p])));
  const solution = leastSquares(scaled, ys, ys.length * EPSILON);

  return xs.map((x) => solution.reduce((value, c, p) => value * x + c / scales[p], 0));
}

// scipy.signal.savgol_coeffs: scipy.linalg.lstsq of A c = e0, with A the powers of the offsets.
function savgolCoefficients(windowLength: number, polyorder: number) {
  const center = (windowLength - 1) / 2;
  const offsets = Array.from({ length: windowLength }, (_, i) => i - center);
  const a = new Matrix(Array.from({ length: polyorder + 1 }, (_, p) => offsets.map((x) => Math.pow(x, p))));
  return leastSquares(a, Array.from({ length: polyorder + 1 }, (_, p) => (p === 0 ? 1 : 0)), EPSILON);
}

function savgolFilter(values: Series, params: Record<string, unknown>): Series {
  const windowLength = toInt("window_length", params.window_length, 7);
  const polyorder = toInt("polyorder", params.polyorder, 2);
  const mode = params.mode === undefined || params.mode === null ? "interp" : params.mode;
  const cval = toFloat("cval", params.cval, 0);
  const n = values.length;

  if (!["mirror", "constant", "nearest", "interp", "wrap"].includes(mode as string)) {
    throw new Error("mode must be 'mirror', 'constant', 'nearest', 'interp' or 'wrap'");
  }
  // Runs synchronously on the main thread, and running out of memory kills the tab instead of throwing.
  if (windowLength > MAX_SAVGOL_WINDOW) throw new Error(`window_length must be at most ${MAX_SAVGOL_WINDOW}`);
  if (polyorder < 0) throw new Error("polyorder must be non-negative");
  if (polyorder >= windowLength) throw new Error("polyorder must be less than window_length");
  if (n === 0) throw new Error("no values to smooth");
  if (mode === "interp" && windowLength > n) throw new Error("window_length must be less than or equal to the size of the data");

  const coefficients = savgolCoefficients(windowLength, polyorder);
  const halfLength = Math.floor(windowLength / 2);
  const isOdd = windowLength % 2 === 1;

  const at = (i: number) => {
    if (i >= 0 && i < n) return values[i];
    if (mode === "interp") return 0; // overwritten below, except where an even window reaches past an edge
    if (mode === "constant") return cval;
    if (mode === "nearest") return i < 0 ? values[0] : values[n - 1];
    if (mode === "wrap") return values[((i % n) + n) % n];
    if (n === 1) return values[0];
    const period = 2 * n - 2;
    const wrapped = ((i % period) + period) % period;
    return values[wrapped < n ? wrapped : period - wrapped];
  };

  // ndimage.correlate1d: odd filters sum symmetric pairs, even ones are shifted one to the right.
  const output = values.map((_, i) => {
    if (isOdd) {
      let sum = at(i) * coefficients[halfLength];
      for (let k = -halfLength; k < 0; k++) sum += (at(i + k) + at(i - k)) * coefficients[k + halfLength];
      return sum;
    }
    return coefficients.reduce((sum, c, k) => sum + c * at(i + k - halfLength + 1), 0);
  });

  if (mode === "interp" && halfLength > 0) {
    const edge = Array.from({ length: halfLength }, (_, i) => i);
    polyfitEvaluate(values.slice(0, windowLength), polyorder, edge).forEach((value, i) => {
      output[i] = value;
    });
    const tail = edge.map((i) => windowLength - halfLength + i);
    polyfitEvaluate(values.slice(n - windowLength), polyorder, tail).forEach((value, i) => {
      output[n - halfLength + i] = value;
    });
  }

  return output;
}

const SMOOTH_FUNCTIONS: Record<string, (values: Series, params: Record<string, unknown>) => Series> = {
  simple_moving_average: simpleMovingAverage,
  exponential_moving_average: exponentialMovingAverage,
  savgol_filter: savgolFilter,
};

function getRoundDecimals(series: Series) {
  const present = series.filter((x) => !Number.isNaN(x));
  if (present.length === 0) throw new Error("no values to detect waves on");
  const max = Math.max(...present);
  if (max <= 0) throw new Error("no positive values to detect waves on");
  // math.log(x, 10) is log(x) / log(10), not log10(x): they disagree on exact powers of ten.
  return Math.min(0, 3 - roundHalfEven(Math.log(max) / Math.LN10));
}

// pandas Series.mode()[0]: the most frequent value, the smallest one on ties.
function rollingSignMode(signs: Series, window: number): Series {
  if (window < 1) throw new Error("sign_window must be positive");

  return signs.map((_, i) => {
    if (i + 1 < window) return NaN;
    const counts: Record<string, number> = { "-1": 0, "0": 0, "1": 0 };
    for (let j = i + 1 - window; j <= i; j++) {
      if (Number.isNaN(signs[j])) return NaN;
      counts[signs[j]] += 1;
    }
    let best = -1;
    [0, 1].forEach((sign) => {
      if (counts[sign] > counts[best]) best = sign;
    });
    return best;
  });
}

type LinearWindows = ReturnType<typeof parseLinearWindows>;

// The API validated these for every method, Otsu included.
function parseLinearWindows(config: WavesConfig) {
  return {
    signWindow: toInt("sign_window", config.sign_window, 5),
    ascendWindow: toInt("ascend_window", config.ascend_window, 5),
    descentWindow: toInt("descent_window", config.descent_window, 5),
    plateauWindow: toInt("plateau_window", config.plateau_window, 5),
    periodMinDays: toInt("period_min_days", config.period_min_days, 14),
    restartMinDays: toInt("restart_min_days", config.restart_min_days, 7),
  };
}

function getFeaturedPeriodsAlt(dates: number[], series: Series, windows: LinearWindows): FeaturedPeriod[] {
  const { signWindow, ascendWindow, descentWindow, plateauWindow, periodMinDays, restartMinDays } = windows;

  // Series.round with decimals <= 0 is rint(x / f) * f.
  const factor = Math.pow(10, -getRoundDecimals(series));
  const rounded = series.map((x) => roundHalfEven(x / factor) * factor);
  const signs = rounded.map((x, i) => (i === 0 ? NaN : Math.sign(x - rounded[i - 1])));
  const signRolling = rollingSignMode(signs, signWindow);

  const periods: Array<[number, number]> = [];

  let ascentN = 0;
  let descentN = 0;
  let plateauN = 0;

  let startDate: number | null = null;
  let startValue = NaN;

  let peekDate = NaN;
  let hasPassedPeak = false;

  dates.forEach((date, i) => {
    const value = series[i];
    const sign = signRolling[i];

    if (sign === 0) {
      ascentN = 0;
      plateauN += 1;
      descentN = 0;
    } else if (sign === 1) {
      ascentN += 1;
      plateauN = 0;
      descentN = 0;
    } else if (sign === -1) {
      ascentN = 0;
      plateauN = 0;
      descentN += 1;
    } else {
      return;
    }

    if (ascentN >= ascendWindow && startDate === null) {
      startDate = date - ascendWindow * DAY_MS;
      startValue = value;
    }

    if (ascentN >= ascendWindow && hasPassedPeak) {
      if (date - peekDate > restartMinDays * DAY_MS) {
        // startValue is deliberately not reset here, the Python code keeps the first one.
        periods.push([startDate as number, date - ascendWindow * DAY_MS]);
        startDate = date - ascendWindow * DAY_MS;
        hasPassedPeak = false;
      }
    }

    if (descentN >= descentWindow && startDate !== null) {
      hasPassedPeak = true;
      peekDate = date;
    }

    if (plateauN >= plateauWindow && hasPassedPeak) {
      periods.push([startDate as number, date]);
      startDate = null;
      startValue = NaN;
      hasPassedPeak = false;
    }

    if (hasPassedPeak && value <= startValue) {
      periods.push([startDate as number, date]);
      startDate = null;
      startValue = NaN;
      hasPassedPeak = false;
    }
  });

  if (startDate !== null) {
    periods.push([startDate, dates[dates.length - 1]]);
  }

  return periods
    .filter(([start, end]) => end - start > periodMinDays * DAY_MS)
    .map(([start, end], index) => ({ id: `id_${index + 1}`, order: index + 1, start, end }));
}

// numpy's pairwise summation, including its 8-way unrolling. The order matters: otsuMethod tests
// total - running_sum against exactly zero, so an ulp here can change which threshold wins.
function pairwiseSum(a: Series, start: number, n: number): number {
  if (n < 8) {
    let result = 0;
    for (let i = 0; i < n; i++) result += a[start + i];
    return result;
  }
  if (n <= 128) {
    const r = a.slice(start, start + 8);
    const blocks = n - n % 8;
    for (let i = 8; i < blocks; i += 8) {
      for (let j = 0; j < 8; j++) r[j] += a[start + i + j];
    }
    let result = r[0] + r[1] + (r[2] + r[3]) + (r[4] + r[5] + (r[6] + r[7]));
    for (let i = blocks; i < n; i++) result += a[start + i];
    return result;
  }
  let half = Math.floor(n / 2);
  half -= half % 8;
  return pairwiseSum(a, start, half) + pairwiseSum(a, start + half, n - half);
}

function otsuMethod(hist: Series) {
  const total = pairwiseSum(hist, 0, hist.length);
  const sumTotal = hist.reduce((sum, value, t) => sum + t * value, 0);

  let weightBackground = 0;
  let sumBackground = 0;
  let optimum = 0;
  let maximum = -Infinity;

  for (let t = 0; t < hist.length; t++) {
    weightBackground += hist[t];
    if (weightBackground === 0) continue;
    const weightForeground = total - weightBackground;
    if (weightForeground === 0) break;

    sumBackground += t * hist[t];
    const meanForeground = (sumTotal - sumBackground) / weightForeground;
    const meanBackground = sumBackground / weightBackground;
    // numpy computes ** 2 as x * x, which Math.pow does not always match to the last bit.
    const meanDifference = meanBackground - meanForeground;
    const variance = weightBackground * weightForeground * (meanDifference * meanDifference);

    if (variance > maximum) {
      optimum = t;
      maximum = variance;
    }
  }
  return optimum;
}

// The Python histogram is a float32 array, which changes which neighbors compare as equal.
function normalisedHistogramBinning(hist: Series, M: number, L: number) {
  const N = Math.floor(L / M);
  const binned = Array.from({ length: M }, (_, i) => {
    let sum = 0;
    for (let j = i * N; j < (i + 1) * N; j++) sum = Math.fround(sum + Math.fround(hist[j]));
    return sum;
  });
  const max = Math.max(...binned);
  return binned.map((x) => Math.fround(Math.fround(x / max) * 100));
}

function findValleys(H: Series) {
  const probs = H.map(() => 0);
  for (let i = 1; i < H.length - 1; i++) {
    if (H[i] > H[i - 1] || H[i] > H[i + 1]) {
      probs[i] = 0;
    } else if (H[i] < H[i - 1] && H[i] === H[i + 1]) {
      probs[i] = 1;
    } else if (H[i] === H[i - 1] && H[i] < H[i + 1]) {
      probs[i] = 3;
    } else if (H[i] < H[i - 1] && H[i] < H[i + 1]) {
      probs[i] = 4;
    } else if (H[i] === H[i - 1] && H[i] === H[i + 1]) {
      probs[i] = probs[i - 1];
    }
  }
  for (let i = 1; i < H.length - 1; i++) {
    if (probs[i] !== 0) {
      probs[i] = Math.floor((probs[i - 1] + probs[i] + probs[i + 1]) / 4);
    }
  }
  return probs.reduce<number[]>((valleys, prob, i) => (prob > 0 ? [...valleys, i] : valleys), []);
}

function modifiedTSMO(hist: Series, M: number, L: number) {
  const N = Math.floor(L / M);
  const valleys = findValleys(normalisedHistogramBinning(hist, M, L));
  return valleys.map((valley) => {
    const start = valley * N - N;
    return start + otsuMethod(hist.slice(start, (valley + 2) * N));
  });
}

function getFeaturedPeriodsOtsu(dates: number[], series: Series): FeaturedPeriod[] {
  // NaNs are dropped here but not from dates, so thresholds index dates off by the missing count, as in Python.
  const hist = series.filter((x) => !Number.isNaN(x));
  const M = 37;
  const L = Math.floor(hist.length / M) * M;

  // Under M points Python raises inside a try block and returns no periods.
  const thresholds = L === 0 ? [] : modifiedTSMO(hist, M, L).sort((a, b) => a - b);

  const periods: FeaturedPeriod[] = [];
  const push = (start: number, end: number) => {
    const order = periods.length + 1;
    periods.push({ id: `id_${order}`, order, start, end });
  };

  let previous = 0;
  thresholds.forEach((x) => {
    push(dates[previous], dates[x]);
    previous = x;
  });
  if (previous !== 0) {
    push(dates[previous], dates[dates.length - 1]);
  }
  return periods;
}

// Same result as GET /featured_periods, from the records of GET /records. Throws where the API returned an error.
export function computeFeaturedPeriods(records: Array<Record<string, any>>, config: WavesConfig): FeaturedPeriods {
  const { target_column: column, method = "linear", smooth_fn: smoothFn = "simple_moving_average", smooth_params: smoothParams = {} } = config;

  if (method !== "linear" && method !== "otsu") {
    throw new Error(`Unknown method: ${method}`);
  }
  const windows = parseLinearWindows(config);
  if (!Object.prototype.hasOwnProperty.call(SMOOTH_FUNCTIONS, smoothFn)) {
    throw new Error(`Unknown smooth function: ${smoothFn}`);
  }

  const kept = records.filter((record) => record[column] > 0);
  const dates = kept.map((record) => new Date(record.date).getTime());
  const smoothed = SMOOTH_FUNCTIONS[smoothFn](kept.map((record) => record[column] as number), smoothParams);

  const featured_periods = method === "otsu" ? getFeaturedPeriodsOtsu(dates, smoothed) : getFeaturedPeriodsAlt(dates, smoothed, windows);

  return {
    featured_periods,
    records: dates.map((date, i) => ({
      date,
      [`${column}_smoothed`]: Number.isNaN(smoothed[i]) ? null : smoothed[i],
    })),
  };
}

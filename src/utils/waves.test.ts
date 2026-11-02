import fs from "fs";
import path from "path";
import { computeFeaturedPeriods } from "./waves";

// The expected values come from the autocovs-server code, see scripts/waves_parity/generate_fixtures.py.
const RELATIVE_TOLERANCE = 1e-9;

type Case = {
  column: string;
  config: Record<string, any>;
  expected: { error: string } | { featured_periods: any[]; smoothed: Array<number | null> };
};
type Location = { dates: number[]; columns: Record<string, Array<number | null>>; cases: Case[] };

function compare(name: string, location: Location, testCase: Case): string[] {
  const { column, config, expected } = testCase;
  const label = `${name} ${column} ${JSON.stringify(config)}`;
  const records = location.dates.map((date, i) => ({ date, [column]: location.columns[column][i] }));

  let actual;
  try {
    actual = computeFeaturedPeriods(records, { ...config, target_column: column });
  } catch (error) {
    return "error" in expected ? [] : [`${label}: threw ${error}`];
  }
  if ("error" in expected) {
    return [`${label}: python raised ${expected.error}, js did not`];
  }

  const failures: string[] = [];
  if (JSON.stringify(actual.featured_periods) !== JSON.stringify(expected.featured_periods)) {
    failures.push(`${label}: periods\n  js ${JSON.stringify(actual.featured_periods)}\n  py ${JSON.stringify(expected.featured_periods)}`);
  }
  const expectedDates = location.dates.filter((_, i) => (location.columns[column][i] ?? 0) > 0);
  if (JSON.stringify(actual.records.map((x) => x.date)) !== JSON.stringify(expectedDates)) {
    failures.push(`${label}: dates differ`);
    return failures;
  }

  // Values next to zero come from cancellation, so they are compared against the largest input in play.
  const scale = Math.max(...location.columns[column].map((x) => Math.abs(x ?? 0)));
  // Savgol goes through LAPACK in Python, the other two have to match to the last bit.
  const bitExact = config.smooth_fn !== "savgol_filter";
  actual.records.forEach((record, i) => {
    const js = record[`${column}_smoothed`] as number | null;
    const py = expected.smoothed[i];
    if (bitExact && js !== py) {
      failures.push(`${label}: [${i}] js ${js} py ${py} are not bit-identical`);
      return;
    }
    if (js === null || py === null) {
      if (js !== py) failures.push(`${label}: [${i}] js ${js} py ${py}`);
      return;
    }
    if (Math.abs(js - py) > RELATIVE_TOLERANCE * Math.max(Math.abs(py), scale * 1e-3)) {
      failures.push(`${label}: [${i}] js ${js} py ${py}`);
    }
  });
  return failures;
}

function compareFile(file: string) {
  const { locations } = JSON.parse(fs.readFileSync(file, "utf8")) as { locations: Record<string, Location> };
  const failures: string[] = [];
  let cases = 0;
  Object.entries(locations).forEach(([name, location]) => {
    location.cases.forEach((testCase) => {
      cases += 1;
      failures.push(...compare(name, location, testCase));
    });
  });
  return { failures, cases };
}

const sweepDir = process.env.WAVES_FIXTURE_DIR;

if (sweepDir) {
  test("matches python over a sweep", () => {
    const files = fs.readdirSync(sweepDir);
    let cases = 0;
    const failures: string[] = [];
    files.forEach((file) => {
      const result = compareFile(path.join(sweepDir, file));
      cases += result.cases;
      failures.push(...result.failures);
    });
    const otsu = failures.filter((x) => x.includes('"method":"otsu"')).length;
    console.log(`sweep: ${files.length} locations, ${cases} cases, ${failures.length} failures (${otsu} otsu)`);
    expect(failures.slice(0, 20)).toEqual([]);
  });
} else {
  test("matches python on the committed sample", () => {
    const { failures, cases } = compareFile(path.join(__dirname, "__fixtures__", "waves.json"));
    expect(cases).toBeGreaterThan(200);
    expect(failures.slice(0, 20)).toEqual([]);
  });
}

describe("computeFeaturedPeriods", () => {
  const records = Array.from({ length: 80 }, (_, i) => ({ date: 1584144000000 + i * 86400000, value: 1 + i }));

  test("rejects a linear window the API would have refused", () => {
    expect(() => computeFeaturedPeriods(records, { target_column: "value", sign_window: "abc" })).toThrow(/sign_window/);
  });

  test.each([["5.0"], ["1e1"], ["0x10"], [""]])("refuses %p like the API's int parameters", (value) => {
    expect(() => computeFeaturedPeriods(records, { target_column: "value", sign_window: value })).toThrow(/sign_window/);
  });

  test("validates linear params under otsu too, as the API did", () => {
    expect(() => computeFeaturedPeriods(records, { target_column: "value", method: "otsu", sign_window: "abc" })).toThrow(/sign_window/);
  });

  test("refuses a savgol window that could exhaust memory, in every mode", () => {
    const smooth_params = { window_length: 1000000000, polyorder: 2, mode: "mirror" };
    expect(() => computeFeaturedPeriods(records, { target_column: "value", smooth_fn: "savgol_filter", smooth_params })).toThrow(/window_length/);
  });

  test("refuses an unknown method", () => {
    expect(() => computeFeaturedPeriods(records, { target_column: "value", method: "bogus" })).toThrow(/method/);
  });

  test("accepts the strings the form inputs produce", () => {
    const fromStrings = computeFeaturedPeriods(records, { target_column: "value", sign_window: "3", period_min_days: "20" });
    const fromNumbers = computeFeaturedPeriods(records, { target_column: "value", sign_window: 3, period_min_days: 20 });
    expect(fromStrings).toEqual(fromNumbers);
  });

  test("ignores params that belong to another smooth function", () => {
    const stale = computeFeaturedPeriods(records, { target_column: "value", smooth_params: { window: 7, polyorder: 99, mode: "bogus" } });
    expect(stale).toEqual(computeFeaturedPeriods(records, { target_column: "value" }));
  });

  test("makes no network calls", () => {
    const spy = jest.fn();
    (global as any).fetch = spy;
    computeFeaturedPeriods(records, { target_column: "value", method: "otsu" });
    expect(spy).not.toHaveBeenCalled();
  });
});

import { clampFeaturedPeriods, clampPeriods, getCommonEndDate, trimPaddedRecords } from "./frozenData";

const row = (date: string, confirmed: number, deaths = 0, extra = {}) => ({ date, confirmed, deaths, ...extra });

describe("trimPaddedRecords", () => {
  it("drops the rows the API pads after the last real report", () => {
    const records = [row("2023-03-08", 1), row("2023-03-09", 2), row("2023-03-10", 3), row("2023-03-11", 3), row("2026-11-01", 3)];

    expect(trimPaddedRecords(records).map((x) => x.date)).toEqual(["2023-03-08", "2023-03-09", "2023-03-10"]);
  });

  it("keeps rows while any single raw column is still being reported", () => {
    const records = [row("a", 1, 0, { people_vaccinated: 1 }), row("b", 1, 0, { people_vaccinated: 2 }), row("c", 1, 0, { people_vaccinated: 2 })];

    expect(trimPaddedRecords(records).map((x) => x.date)).toEqual(["a", "b"]);
  });

  it("ignores derived columns, whose moving averages keep decaying over the padding", () => {
    const records = [row("a", 1, 0, { confirmed_daily_21d: 3 }), row("b", 2, 0, { confirmed_daily_21d: 2 }), row("c", 2, 0, { confirmed_daily_21d: 1 })];

    expect(trimPaddedRecords(records).map((x) => x.date)).toEqual(["a", "b"]);
  });

  it("keeps plateaus in the middle of the series", () => {
    const records = [row("a", 1), row("b", 1), row("c", 2), row("d", 2)];

    expect(trimPaddedRecords(records).map((x) => x.date)).toEqual(["a", "b", "c"]);
  });

  it("keeps the first row of a location that never changed", () => {
    expect(trimPaddedRecords([row("a", 0), row("b", 0)]).map((x) => x.date)).toEqual(["a"]);
  });

  it("handles empty input", () => {
    expect(trimPaddedRecords([])).toEqual([]);
  });
});

describe("trimPaddedRecords with columns", () => {
  it("only looks at the given columns, so vaccination updates don't keep a flat cases tail", () => {
    const records = [row("a", 1, 0, { vaccines: 1 }), row("b", 2, 0, { vaccines: 2 }), row("c", 2, 0, { vaccines: 3 })];

    expect(trimPaddedRecords(records, ["confirmed"]).map((x) => x.date)).toEqual(["a", "b"]);
  });
});

describe("clampFeaturedPeriods", () => {
  const featured = {
    featured_periods: [
      { id: "id_1", start: 1, end: 5 },
      { id: "id_2", start: 5, end: 20 },
      { id: "id_3", start: 20, end: 30 },
    ],
    records: [{ date: 5 }, { date: 10 }, { date: 11 }],
  };

  test("cuts periods and smoothed records at the last real date", () => {
    expect(clampFeaturedPeriods(featured, 10)).toEqual({
      featured_periods: [
        { id: "id_1", start: 1, end: 5 },
        { id: "id_2", start: 5, end: 10 },
      ],
      records: [{ date: 5 }, { date: 10 }],
    });
  });
});

describe("clampPeriods", () => {
  const period = (start: number, end: number) => ({ start, end });

  it("ends the last wave at the last record and keeps earlier waves untouched", () => {
    expect(clampPeriods([period(1, 5), period(5, 20)], 10)).toEqual([period(1, 5), period(5, 10)]);
  });

  it("drops waves that only exist in the padded rows", () => {
    expect(clampPeriods([period(1, 5), period(12, 20)], 10)).toEqual([period(1, 5)]);
  });
});

describe("getCommonEndDate", () => {
  const early = new Date(2023, 2, 10);
  const late = new Date(2024, 9, 19);

  it("returns the last date every location has data for", () => {
    expect(getCommonEndDate({ a: [{ date: early }], b: [{ date: early }, { date: late }] })).toEqual(early);
  });

  it("returns the end of the location when there is only one", () => {
    expect(getCommonEndDate({ b: [{ date: early }, { date: late }] })).toEqual(late);
  });

  it("skips locations without rows and returns undefined when none have any", () => {
    expect(getCommonEndDate({ a: [], b: [{ date: early }] })).toEqual(early);
    expect(getCommonEndDate({ a: [] })).toBeUndefined();
  });
});

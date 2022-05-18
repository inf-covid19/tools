import { first, sum } from "lodash";
import { defaultPolicies } from "./constants";

export function getUnifiedRestrictionPoints(records, { restrictions = defaultPolicies } = {}) {
  const series = records.map((x) => {
    return {
      ...x,
      unified_restriction: sum(defaultPolicies.map((attr) => Math.abs(x[attr]))),
    };
  });

  console.log('--- unified series ---', series)

  return getRestrictionPoints(series, { restriction: "unified_restriction" });
}

export function getRestrictionPoints(records, { restriction }) {
  const points = [];

  let previousValue = first(records)[restriction];
  records.forEach((x) => {
    const value = x[restriction];
    if (Math.abs(value) !== Math.abs(previousValue)) {
      points.push({ ...x, previousValue });
      previousValue = value;
    }
  });

  return points;
}

export function getVacinationMilestones(records) {
  let dateWhenStarted = null;
  let dateWhenReach70 = null;

  for (const x of records) {
    if (dateWhenStarted === null && x.people_vaccinated > 0) {
      dateWhenStarted = x.date;
    }

    if (dateWhenReach70 === null && x.people_vaccinated / x.population >= 0.7) {
      dateWhenReach70 = x.date;
    }

    if (![dateWhenStarted, dateWhenReach70].includes(null)) {
      break;
    }
  }

  return [
    { date: dateWhenStarted, label: "Vacination started", id: "vacination_start" },
    { date: dateWhenReach70, label: "70% of population with at least one shot", id: "vacination_70" },
  ].filter((x) => !!x.date);
}

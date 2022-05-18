import React, { useMemo } from "react";
import { format as formatDate } from "date-fns";
import { first, keyBy, last, orderBy } from "lodash";
import { getRestrictionPoints, getVacinationMilestones } from "./utils/functions";
import { MeasuresConfig } from "./utils/constants";
import { Accordion } from "semantic-ui-react";

function LocationStory({ records, featuredConfirmedPeriods, featuredDeathsPeriods, location, covidVariants }) {
  const vacinationMilestones = useMemo(() => {
    const milestones = getVacinationMilestones(records);
    return keyBy(milestones, "id");
  }, [records]);

  const pointsByRestrictions = useMemo(() => {
    const mapping = {};
    Object.keys(MeasuresConfig).forEach((key) => {
      mapping[key] = getRestrictionPoints(records, { restriction: key });
    });
    return mapping;
  }, [records]);

  const variantDates = useMemo(() => {
    const dateByVariant = covidVariants[location.country];

    if (!dateByVariant) {
      return [];
    }

    return orderBy(
      Object.entries(dateByVariant).map(([variant, date]) => {
        return {
          date,
          variant,
        };
      }),
      (x) => new Date(x.date)
    );
  }, [covidVariants, location]);

  return (
    <div class="ui container">
      <p>
        In {location.displayName}, the pandemic began with the first case reported on {formatDate(first(records).date, "PPP")}. Below are some news reported in that period:
        <ul>
          <li>TBD</li>

          <li>TBD</li>

          <li>TBD</li>

          <li>TBD</li>
        </ul>
      </p>

      <p>
        As of this date, this place has gone through {featuredConfirmedPeriods.featured_periods.length} waves of confirmed cases and {featuredDeathsPeriods.featured_periods.length}{" "}
        waves of confirmed deaths.
      </p>

      {featuredConfirmedPeriods.featured_periods.map(({ start, end }, index) => {
        const filterFn = (x) => {
          const date = new Date(x.date).getTime();
          return date >= start && date < end;
        };

        const sortedConfirmedRecords = orderBy(records.filter(filterFn), "confirmed_daily");
        const sortedDeathsRecords = orderBy(records.filter(filterFn), "deaths_daily");

        const variantDatesForThisPeriod = variantDates.filter(filterFn);

        const waveName = (() => {
          const n = `${index + 1}`;

          if (n.endsWith("1")) return `${n}st`;
          if (n.endsWith("2")) return `${n}nd`;
          if (n.endsWith("3")) return `${n}rd`;

          return `${n}th`;
        })();

        const accordionConfig = Object.entries(pointsByRestrictions).flatMap(([restriction, points]) => {
          const config = MeasuresConfig[restriction];
          const filteredPoints = points.filter(filterFn);

          if (filteredPoints.length === 0) {
            return [];
          }

          return {
            key: restriction,
            title: {
              content: config.name,
            },
            content: {
              content: (
                <ul>
                  {filteredPoints.map((point) => {
                    return (
                      <li key={point.date}>
                        On {formatDate(point.date, "PPP")}, the <b>{config.name}</b> policy changed to <i>{config.indicators[Math.abs(point[restriction])]}</i>.
                      </li>
                    );
                  })}
                </ul>
              ),
            },
          };
        });

        return (
          <>
            <p>
              At the {waveName} wave, which happened between {formatDate(start, "PPP")} and {formatDate(end, "PPP")}, the following actions were taken:
              <Accordion panels={accordionConfig} />
            </p>
            <p>
              The peak of confirmed cases on the {waveName} wave happened on {formatDate(last(sortedConfirmedRecords).date, "PPP")} when{" "}
              {last(sortedConfirmedRecords).confirmed_daily} cases were confirmed. In this wave, the peak of confirmed deaths happened on{" "}
              {formatDate(last(sortedDeathsRecords).date, "PPP")} with {last(sortedDeathsRecords).deaths_daily} deaths being confirmed on that day. Below are some news reported in
              that period:{" "}
              <ul>
                <li>TBD</li>

                <li>TBD</li>

                <li>TBD</li>

                <li>TBD</li>
              </ul>
            </p>

            {variantDatesForThisPeriod.length > 0 && (
              <p>
                During this period, the following variants were first identified in the country:
                <ul>
                  {variantDatesForThisPeriod.flatMap(({ date, variant }) => {
                    if (variant.includes(".")) {
                      return [];
                    }

                    return (
                      <li>
                        <b>{variant}</b> on {formatDate(new Date(date), "PPP")}
                      </li>
                    );
                  })}
                </ul>
              </p>
            )}

            {/* <caso haja surgimento de uma variante em uma data nesse intervalo>: No dia <dia de surgimento da variante> foram identificados os primeiros casos da variante <nome da variante> neste local. Abaixo são listadas algumas notícias daquele período <lista de notícias buscadas na quinzena deste evento>. */}
          </>
        );
      })}

      <p>
        In this location, vaccination started on {formatDate(vacinationMilestones.vacination_start.date, "PPP")}
        {vacinationMilestones.vacination_70 ? <> and reaches 70% of the vaccinated population on {formatDate(vacinationMilestones.vacination_70.date, "PPP")}.</> : <>.</>}
      </p>
    </div>
  );
}

export default LocationStory;

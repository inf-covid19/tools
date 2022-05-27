import styled from "styled-components";
import { addDays, format as formatDate, subDays } from "date-fns";
import { first, keyBy, last, orderBy } from "lodash";
import React, { useMemo } from "react";
import { useQuery } from "react-query";
import { Accordion } from "semantic-ui-react";
import DataLoader from "../DataLoader";
import { makeGet } from "./utils/api";
import { MeasuresConfig } from "./utils/constants";
import { getRestrictionPoints, getVacinationMilestones } from "./utils/functions";
import concat from "lodash/concat";

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

  const wavesList = useMemo(() => {
    return featuredConfirmedPeriods.featured_periods.map(({ start, end }, index) => {
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
            icon: "plus",
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

      return {
        start,
        end,
        waveName,
        accordionConfig,
        variantDatesForThisPeriod,
        sortedConfirmedRecords,
        sortedDeathsRecords,
        confirmedPeek: last(sortedConfirmedRecords),
        deathsPeek: last(sortedDeathsRecords),
      };
    });
  }, [featuredConfirmedPeriods.featured_periods, pointsByRestrictions, records, variantDates]);

  const firstDate = first(records).date;

  const { data: newsData, status } = useQuery(["initials-news", { location, firstDate, vacinationMilestones, waves: featuredConfirmedPeriods?.featured_periods }], async () => {
    const locationName = location.isCountry ? location.name : `${location.name} + ${location.country}`;

    const { news_list: initialNews } = await makeGet("/news/initial", {
      location: locationName,
      start_date: subDays(firstDate, 7).toISOString(),
      end_date: addDays(firstDate, 7).toISOString(),
    });

    const [vacinationStartNews, vacination70News] = await Promise.all([
      vacinationMilestones.vacination_start
        ? makeGet("/news/vaccination", {
            location: locationName,
            start_date: subDays(vacinationMilestones.vacination_start.date, 7).toISOString(),
            end_date: addDays(vacinationMilestones.vacination_start.date, 7).toISOString(),
          })
        : Promise.resolve({}),
      vacinationMilestones.vacination_70
        ? makeGet("/news/vaccination", {
            location: locationName,
            start_date: subDays(vacinationMilestones.vacination_70.date, 7).toISOString(),
            end_date: addDays(vacinationMilestones.vacination_70.date, 7).toISOString(),
          })
        : Promise.resolve({}),
    ]);

    const newsBasedOnPeek = await Promise.all(
      wavesList
        .flatMap((wave) => [wave.confirmedPeek.date, wave.deathsPeek.date])
        .map((date) =>
          makeGet("/news/peak", {
            location: locationName,
            start_date: subDays(date, 7).toISOString(),
            end_date: addDays(date, 7).toISOString(),
          }).then((x) => [date, x.news_list])
        )
    );

    return { initialNews, vacinationStartNews: vacinationStartNews.news_list, vacination70News: vacination70News.news_list, newsByWavePeek: Object.fromEntries(newsBasedOnPeek) };
  });

  if (status === "loading") {
    return <DataLoader />;
  }

  return (
    <div class="ui container">
      <p>
        In {location.displayName}, the pandemic began with the first case reported on {formatDate(firstDate, "PPP")}.
        {newsData?.initialNews?.length > 0 && (
          <>
            {" "}Below are some news reported in that period:
            <Accordion
              panels={[
                {
                  key: "news",
                  title: "Click here to see the news",
                  content: {
                    content: (
                      <ul>
                        {newsData?.initialNews.map(({ title, url, published_at }) => (
                          <li>
                            <a href={url} rel="noopener noreferrer" target="_blank">
                              {title}
                            </a>{" "}
                            on {formatDate(published_at, "PPP")}
                          </li>
                        ))}
                      </ul>
                    ),
                  },
                },
              ]}
            />
          </>
        )}
      </p>

      <p>
        As of this date, this place has gone through {featuredConfirmedPeriods.featured_periods.length} waves of confirmed cases and {featuredDeathsPeriods.featured_periods.length}{" "}
        waves of confirmed deaths.
      </p>

      {wavesList.map((waveConfig) => {
        const { variantDatesForThisPeriod, waveName, accordionConfig, deathsPeek, confirmedPeek, start, end } = waveConfig;
        const confirmedPeekNews = newsData.newsByWavePeek[confirmedPeek.date]?.slice(0, 3);
        const deathsPeekNews = newsData.newsByWavePeek[deathsPeek.date]?.filter((x) => !confirmedPeekNews.some((y) => x.title === y.title)).slice(0, 3);

        const newsList = concat(confirmedPeekNews, deathsPeekNews);

        return (
          <>
            <p>
              The <b>{waveName} wave</b> happened between {formatDate(start, "PPP")} and {formatDate(end, "PPP")}.
              {accordionConfig?.lenght > 0 && (
                <Accordion
                  panels={[
                    {
                      key: waveName,
                      title: "Click the to see the actions that were taken",
                      content: {
                        content: (
                          <SubAccordionWrapper>
                            <Accordion.Accordion panels={accordionConfig} />
                          </SubAccordionWrapper>
                        ),
                      },
                    },
                  ]}
                />
              )}
            </p>
            <p>
              The peak of confirmed cases on the {waveName} wave happened on {formatDate(confirmedPeek.date, "PPP")} when {confirmedPeek.confirmed_daily} cases were confirmed. In
              this wave, the peak of confirmed deaths happened on {formatDate(deathsPeek.date, "PPP")} with {deathsPeek.deaths_daily} deaths being confirmed on that day.
              {newsList.length > 0 && (
                <>
                  {" "}Below are some news reported in that period:{" "}
                  <Accordion
                    panels={[
                      {
                        key: "news",
                        title: "Click here to see the news",
                        content: {
                          content: (
                            <ul>
                              {newsList.map(({ title, url, published_at }) => (
                                <li>
                                  <a href={url} rel="noopener noreferrer" target="_blank">
                                    {title}
                                  </a>{" "}
                                  on {formatDate(published_at, "PPP")}
                                </li>
                              ))}
                            </ul>
                          ),
                        },
                      },
                    ]}
                  />
                </>
              )}
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
        {[newsData?.vacinationStartNews?.length, newsData?.vacination70News?.length].some((x) => x > 0) && (
          <>
            {" "}Below are some news reported in that period:
            <Accordion
              panels={[
                {
                  key: "news",
                  title: "Click here to see the news",
                  content: {
                    content: (
                      <ul>
                        {concat(newsData?.vacinationStartNews?.slice(0, 3), newsData?.vacination70News?.slice(0, 3)).map(({ title, url, published_at }) => (
                          <li>
                            <a href={url} rel="noopener noreferrer" target="_blank">
                              {title}
                            </a>{" "}
                            on {formatDate(published_at, "PPP")}
                          </li>
                        ))}
                      </ul>
                    ),
                  },
                },
              ]}
            />
          </>
        )}
      </p>
    </div>
  );
}

export default LocationStory;

const SubAccordionWrapper = styled.div`
  margin-left: 20px;

  > .accordion {
    margin: 0 !important;
  }
`;

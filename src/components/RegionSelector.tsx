import React, { useMemo, useState, useEffect, useCallback, Fragment } from "react";
import useMetadata from "../hooks/useMetadata";
import { Dropdown, Header, Flag } from "semantic-ui-react";
import debounce from "lodash/debounce";
import Fuse from "fuse.js";
import { keyBy, sortBy, isEmpty, groupBy, uniq } from "lodash";
import get from "lodash/get";
import { PLACE_TYPE_LABEL_MAPPING } from "../constants";

import "./RegionSelector.css";

type Props = {
  value: Record<string, boolean>;
  onChange: (value: Record<string, boolean>) => void;
};

export default function RegionSelector({ value, onChange }: Props) {
  const [search, setSearch] = useState("");
  const [fromValue, setFromValue] = useState("all");
  const [selected, setSelected] = useState<string[]>(Object.keys(value).filter((k) => value[k]));
  const { data: metadata, loading } = useMetadata();

  const [regions, groups] = useMemo(() => {
    if (!metadata) return [{}, {}];

    const groups: Record<string, Record<string, Array<{ value: string; name: string; parent: string; flag: string; text: string; country: string }>>> = {};

    const arr = Object.entries(metadata).flatMap(([country, countryData]) => {
      const countryName = countryData.name.replace(/_/g, " ") as string;

      const regions = Object.entries(countryData.regions as Record<string, any>).map(([region, regionData]) => ({
        value: `${country}.regions.${region}`,
        name: regionData.name as string,
        parent: `${regionData.parent || country}`,
        flag: (countryData.geoId as string).toLowerCase(),
        text: `${regionData.name}${regionData.parent ? `, ${regionData.parent}` : ""}, ${countryName}`,
        type: `${regionData.place_type}`,
        country,
      }));

      groups[country] = groupBy(regions, (r) => `${r.parent}:${r.type}`)!;

      return [
        {
          value: country,
          name: countryName,
          text: countryName,
          flag: countryData.geoId.toLowerCase(),
        },
        ...regions,
      ];
    });

    return [keyBy(arr, "value"), groups];
  }, [metadata]);

  const fromOptions = useMemo(() => {
    const defaultFromOptions = [
      {
        content: "Everywhere",
        text: "everywhere",
        value: "all",
        icon: "globe",
      },
    ];

    if (!metadata) return defaultFromOptions;

    const fromOptions = Object.entries(metadata).flatMap(([country, countryData]) => {
      if (Object.keys(countryData.regions).length === 0) return [];
      const countryName = countryData.name.replace(/_/g, " ") as string;

      return [
        {
          text: countryName,
          value: country,
          flag: countryData.geoId.toLowerCase(),
        },
      ];
    });

    return [...defaultFromOptions, ...fromOptions];
  }, [metadata]);

  const fuse = useMemo(() => {
    return new Fuse(Object.values(regions), {
      minMatchCharLength: 1,
      threshold: 0.3,
      keys: [
        { name: "name", weight: 0.5 },
        { name: "parent", weight: 0.3 },
        { name: "country", weight: 0.2 },
      ],
    });
  }, [regions]);

  const selectedOptions = useMemo(() => {
    return selected.map((value) => regions[value]).filter(Boolean);
  }, [regions, selected]);

  const options = useMemo(() => {
    if (fromValue !== "all") {
      return selectedOptions.concat(
        sortBy(
          Object.values(regions).filter((region) => "country" in region && region.country === fromValue),
          ["value"]
        )
      );
    }

    if (search.length < 1) return selectedOptions;

    const result = fuse.search(search, { limit: 30 }).map(({ item }) => item);
    return selectedOptions.concat(result);
  }, [fromValue, search, selectedOptions, fuse, regions]);

  const onSearchChangeHandler = useCallback(
    debounce((_: any, { searchQuery }: any) => {
      setSearch(searchQuery);
    }, 100),
    []
  );

  const onChangeHandler = useCallback((_: any, { value }: any) => {
    setSelected(value);
    setSearch("");
  }, []);

  useEffect(() => {
    onChange(Object.fromEntries(selected.map((k) => [k, true])));
  }, [onChange, selected]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          marginBottom: "1rem",
        }}
      >
        <div style={{ marginRight: "2rem" }}>
          <Header as="h4">
            Select regions from{" "}
            <Dropdown style={{ zIndex: 13 }} header="Adjust scope" inline options={fromOptions} value={fromValue} onChange={(_: any, { value }: any) => setFromValue(value)} />
          </Header>
        </div>

        <div>
          <Header as="h4" color="grey">
            <Dropdown style={{ zIndex: 13 }} text="Select region group" inline direction="left" scrolling>
              <Dropdown.Menu>
                {Object.entries(groups).flatMap(([country, regions]) => {
                  if (isEmpty(regions)) {
                    return null;
                  }

                  const countryName = country.replace(/_/g, " ");

                  return (
                    <Fragment key={country}>
                      <Dropdown.Header>
                        <Flag name={get(metadata, [country, "geoId"], "").toLowerCase()} /> {countryName}
                      </Dropdown.Header>
                      {Object.entries(regions).map(([group, items]) => {
                        const [groupName, type] = group.split(":", 2);

                        return (
                          <Dropdown.Item key={`${country}-${group}`} className="RegionSelector--group--item" onClick={() => setSelected((prev) => uniq(prev.concat(items.map((i) => i.value))))}>
                            {`${PLACE_TYPE_LABEL_MAPPING[type]} from ${groupName.replace(/_/g, " ")}`}
                            <span className="RegionSelector--group--item--only" onClick={() => setSelected(items.map((i) => i.value))}>
                              only
                            </span>
                          </Dropdown.Item>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </Dropdown.Menu>
            </Dropdown>
          </Header>
        </div>
      </div>
      <Dropdown
        style={{ zIndex: 12 }}
        placeholder={fromValue === "all" ? "Search for countries, states, provinces..." : `Choose regions from ${fromValue}...`}
        clearable
        fluid
        category
        search
        multiple
        selection
        loading={loading}
        options={options}
        value={selected}
        minCharacters={1}
        noResultsMessage={search.length < 1 ? "Start typing..." : "No results found."}
        onChange={onChangeHandler}
        onSearchChange={onSearchChangeHandler}
      />
    </div>
  );
}

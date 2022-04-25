import Fuse from "fuse.js";
import { castArray, defaultTo, flatMap, groupBy, keyBy, sortBy } from "lodash";
import debounce from "lodash/debounce";
import first from "lodash/first";
import React, { useCallback, useMemo, useState } from "react";
import { Dropdown, Header } from "semantic-ui-react";
import useMetadata, { Location } from "../hooks/useMetadata";
import { getByRegionId, getDisplayNameFromLocation, getNameFromLocation } from "../utils/metadata";
import "./RegionSelector.css";

type Props = {
  value: Record<string, boolean>;
  multiple?: boolean;
  onChange: (value: Record<string, boolean>) => void;
  filter?: (key: string) => boolean;
  zIndex?: number;
};

export default function RegionSelector({ value, onChange, multiple = true, filter = () => true, zIndex = 13 }: Props) {
  const [search, setSearch] = useState("");
  const [fromValue, setFromValue] = useState("all");
  const selected = useMemo(() => Object.keys(value).filter((k) => value[k]), [value]);
  const { data: metadata, loading } = useMetadata();

  const [regions] = useMemo(() => {
    if (!metadata) return [{}, {}];

    const groups: Record<string, Record<string, Array<{ value: string; name: string; parent: string; flag: string; text: string; country: string }>>> = {};

    const arr = Object.entries(metadata).flatMap(([country, countryData]) => {
      const { flag, displayName } = getByRegionId(metadata, country);

      const getOptionFromLocation = (regionData: Location, parent: string, country: string) => ({
        value: regionData.id,
        name: getNameFromLocation(regionData),
        parent,
        flag,
        text: getDisplayNameFromLocation(regionData),
        type: `administrative_area_level_${regionData.administrative_area_level}`,
        country,
      });

      const regions = flatMap(countryData.children, (regionData) => {
        return [
          getOptionFromLocation(regionData, regionData.administrative_area_level_1, country),
          ...regionData.children.map((x) => getOptionFromLocation(x, regionData.administrative_area_level_2!, country)),
        ];
      });

      groups[country] = groupBy(regions, (r) => `${r.parent}:${r.type}`)!;

      return [
        {
          value: country,
          name: displayName,
          text: displayName,
          flag,
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

    const fromOptions = sortBy(
      Object.entries(metadata).flatMap(([country, countryData]) => {
        if (Object.keys(countryData.children).length === 0) return [];

        const { displayName, flag } = getByRegionId(metadata, country);

        return [
          {
            text: displayName,
            value: country,
            flag: flag,
          },
        ];
      }),
      "text"
    );

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

  const allOptions = useMemo(() => {
    if (search.length < 2) return selectedOptions;

    const result = fuse.search(search, { limit: 10 }).map(({ item }) => item);
    if (multiple) {
      return selectedOptions.concat(result);
    }
    return result;
  }, [search, selectedOptions, fuse, multiple]);

  const options = useMemo(() => {
    return allOptions.filter((o) => filter(o.value));
  }, [allOptions, filter]);

  const onSearchChangeHandler = useCallback(
    debounce((_: any, { searchQuery }: any) => {
      setSearch(searchQuery);
    }, 100),
    []
  );

  const setSelected = useCallback(
    (values: string[]) => {
      onChange(Object.fromEntries(values.map((k) => [k, true])));
    },
    [onChange]
  );

  const onChangeHandler = useCallback(
    (_: any, { value }: any) => {
      setSelected(castArray(value));
      setSearch("");
    },
    [setSelected]
  );

  return (
    <div>
      {multiple && (
        <div
          style={{
            display: "flex",
            marginBottom: "1rem",
          }}
        >
          <div style={{ marginRight: "2rem" }}>
            <Header as="h4">
              Select regions from{" "}
              <Dropdown
                selectOnNavigation={false}
                style={{ zIndex }}
                header="Adjust scope"
                inline
                options={fromOptions}
                value={fromValue}
                onChange={(_: any, { value }: any) => setFromValue(value)}
                scrolling
              />
            </Header>
          </div>
          {/* 
          <div>
            <Header as="h4" color="grey">
              <Dropdown selectOnNavigation={false} style={{ zIndex: 13 }} text="Select region group" inline scrolling>
                <Dropdown.Menu>
                  <Fragment key={"world"}>
                    <Dropdown.Header icon="globe" content="World" />
                    <Dropdown.Item className="RegionSelector--group--item" onClick={() => setSelected(uniq(selected.concat(DEFAULT_COUNTRIES)))}>
                      Default countries
                    </Dropdown.Item>
                  </Fragment>
                  {metadata &&
                    Object.entries(groups).flatMap(([country, regions]) => {
                      if (isEmpty(regions)) {
                        return null;
                      }

                      const { displayName, flag } = getByRegionId(metadata, country);

                      return (
                        <Fragment key={country}>
                          <Dropdown.Header>
                            <Flag name={flag} /> {displayName}
                          </Dropdown.Header>
                          {Object.entries(regions).map(([group, items]) => {
                            const [groupName, type] = group.split(":", 2);

                            return (
                              <Dropdown.Item
                                key={`${country}-${group}`}
                                className="RegionSelector--group--item"
                                onClick={() => setSelected(uniq(selected.concat(items.map((i) => i.value))))}
                              >
                                {`${PLACE_TYPE_LABEL_MAPPING[type]} from ${groupName.replace(/_/g, " ")}`}
                              </Dropdown.Item>
                            );
                          })}
                        </Fragment>
                      );
                    })}
                </Dropdown.Menu>
              </Dropdown>
            </Header>
          </div> */}
        </div>
      )}
      <Dropdown
        className={multiple ? undefined : "large"}
        selectOnNavigation={false}
        style={{ zIndex: zIndex - 1 }}
        placeholder={fromValue === "all" ? "Search for countries, states, provinces..." : `Choose regions from ${getByRegionId(metadata!, fromValue).displayName}...`}
        clearable
        fluid
        search
        multiple={multiple}
        selection
        loading={loading}
        options={options}
        value={multiple ? selected : defaultTo(first(selected), undefined)}
        minCharacters={1}
        noResultsMessage={search.length < 1 ? "Start typing..." : "No results found."}
        onChange={onChangeHandler}
        onSearchChange={onSearchChangeHandler}
      />
    </div>
  );
}

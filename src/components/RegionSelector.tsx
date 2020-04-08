import React, { useMemo, useState, useEffect, useCallback } from "react";
import useMetadata from "../hooks/useMetadata";
import { Dropdown, Header } from "semantic-ui-react";
import debounce from "lodash/debounce";
import Fuse from "fuse.js";
import { keyBy, sortBy } from "lodash";

type Props = {
  value: Record<string, boolean>;
  onChange: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
};

export default function RegionSelector({ value, onChange }: Props) {
  const [search, setSearch] = useState("");
  const [fromValue, setFromValue] = useState("all");
  const [selected, setSelected] = useState<string[]>(Object.keys(value).filter((k) => value[k]));
  const { data: metadata, loading } = useMetadata();

  const regions = useMemo(() => {
    if (!metadata) return {};

    const arr = Object.entries(metadata).flatMap(([country, countryData]) => {
      const countryName = countryData.name.replace(/_/g, " ") as string;

      return [
        {
          value: country,
          name: countryName,
          text: countryName,
          flag: countryData.geoId.toLowerCase(),
        },
        ...Object.entries(countryData.regions as Record<string, any>).map(([region, regionData]) => ({
          value: `${country}.regions.${region}`,
          name: regionData.name as string,
          parent: regionData.parent as string,
          flag: countryData.geoId.toLowerCase(),
          text: `${regionData.name}${regionData.parent ? `, ${regionData.parent}` : ""}, ${countryName}`,
          country,
        })),
      ];
    });

    return keyBy(arr, "value");
  }, [metadata]);

  const fromOptions = useMemo(() => {
    const defaultFromOptions = [
      {
        text: "everywhere",
        value: "all",
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

    return defaultFromOptions.concat(fromOptions);
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
          "text"
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
      <Header>
        Select regions from <Dropdown
        style={{ zIndex: 13 }} inline options={fromOptions} value={fromValue} onChange={(_: any, { value }: any) => setFromValue(value)} />
      </Header>
      <Dropdown
        style={{ zIndex: 12 }}
        placeholder={fromValue === "all" ? "Search for countries, states, provincies..." : `Choose regions from ${fromValue}...`}
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

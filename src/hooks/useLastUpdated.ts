import { subHours } from "date-fns";
import { useMemo } from "react";
import { useQuery } from "react-query";
import { get } from "lodash";

const defaultLastUpdated = subHours(new Date(), 2).toISOString();

const fetchRepo = async () => {
  const response = await fetch("https://api.github.com/repos/inf-covid19/data/branches/master");
  const data = await response.json();

  return get(data, "commit.commit.author.date", defaultLastUpdated);
};

export default function useLastUpdated() {
  const { data = defaultLastUpdated } = useQuery("last-updated", fetchRepo);

  return useMemo(() => {
    return new Date(data);
  }, [data]);
}

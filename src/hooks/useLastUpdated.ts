import { useState, useEffect } from "react";
import { subHours } from "date-fns";

export default function useLastUpdated() {
  const [date, setDate] = useState(subHours(new Date(), 2));

  useEffect(() => {
    let cancelled = false;

    fetch("https://api.github.com/repos/inf-covid19/tools/branches/master")
      .then(resp => resp.json())
      .then(json => {
        if (cancelled) return;
        setDate(new Date(json.commit.commit.author.date));
      })
      .catch(error => {
        console.warn("Unable to fetch last updated date.", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return date;
}

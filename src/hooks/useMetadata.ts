import { useState, useEffect, useMemo } from "react";

export const METADATA_KEY = "covid19-tools.metadata.cacheV2";

export default function useMetadata() {
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("https://raw.githubusercontent.com/inf-covid19/covid19-data/master/data/metadata.json")
      .then(resp => resp.json())
      .then(json => {
        if (cancelled) return;

        localStorage.setItem(METADATA_KEY, JSON.stringify(json));

        setMetadata(json);
      })
      .catch(error => {
        console.warn("Unable to fetch metadata.", error);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => ({ data: metadata, loading }), [metadata, loading]);
}

import { useState, useEffect, useMemo } from "react";
import { getMetadata } from "../store";
export const METADATA_KEY = "covid19-tools.metadata.v1";

export default function useMetadata() {
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    getMetadata()
      .then(data => {
        if (cancelled) return;

        localStorage.setItem(METADATA_KEY, JSON.stringify(data));

        setData(data);
      })
      .catch(error => {
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => ({ data, loading, error }), [data, loading, error]);
}

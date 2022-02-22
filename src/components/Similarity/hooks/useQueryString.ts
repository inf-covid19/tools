import { useLocation, useHistory } from "react-router-dom";
import queryString from "query-string";
import { useCallback, useMemo } from "react";

function useQueryString() {
  const history = useHistory();
  const { search } = useLocation();

  const params = useMemo(() => queryString.parse(search), [search]);

  const setParams = useCallback(
    (nextParams: queryString.ParsedQuery) => {
      const search = queryString.stringify({ ...params, ...nextParams });

      history.push({
        search,
      });
    },
    [params, history]
  );

  return [params, setParams] as const;
}

export default useQueryString;

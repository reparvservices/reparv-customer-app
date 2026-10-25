import {useEffect, useState, useCallback} from 'react';
import {
  fetchAllPropertiesCached,
  peekFreshAllProperties,
} from '../services/allPropertiesCache';

/**
 * Subscribes to the shared all-properties cache. Multiple mounted components
 * share one network request.
 */
export function useAllPropertiesCache() {
  const [data, setData] = useState(
    () => peekFreshAllProperties() ?? [],
  );
  const [loading, setLoading] = useState(() => !peekFreshAllProperties());
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const warm = peekFreshAllProperties();
    if (warm) {
      setData(warm);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    fetchAllPropertiesCached()
      .then(list => {
        if (!cancelled) {
          setData(Array.isArray(list) ? list : []);
          setError(null);
        }
      })
      .catch(e => {
        if (!cancelled) {
          setError(e);
          setData([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    return fetchAllPropertiesCached({force: true})
      .then(list => {
        setData(Array.isArray(list) ? list : []);
        setError(null);
        return list;
      })
      .catch(e => {
        setError(e);
        throw e;
      })
      .finally(() => setLoading(false));
  }, []);

  return {data, loading, error, refetch};
}

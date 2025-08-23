import { useEffect, useRef, useState, useCallback } from 'react';

interface UsePollingOptions {
  interval?: number; // in milliseconds
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export function usePolling<T>(
  fetchFunction: () => Promise<T>,
  options: UsePollingOptions = {}
) {
  const {
    interval = 30000, // Default 30 seconds
    enabled = true,
    onError
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;
    
    console.log(`[POLLING DEBUG] Fetching data with interval: ${interval}ms at ${new Date().toISOString()}`);
    
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      
      if (mountedRef.current) {
        setData(result);
        setLastUpdated(new Date());
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      
      if (mountedRef.current) {
        setError(error);
        onError?.(error);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFunction, onError, interval]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      console.log(`[POLLING DEBUG] Clearing existing interval`);
      clearInterval(intervalRef.current);
    }
    
    console.log(`[POLLING DEBUG] Starting polling with ${interval}ms interval`);
    
    // Fetch immediately
    fetchData();
    
    // Then set up interval
    intervalRef.current = setInterval(fetchData, interval);
    console.log(`[POLLING DEBUG] Interval set with ID:`, intervalRef.current);
  }, [fetchData, interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (enabled) {
      startPolling();
    }

    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [enabled]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch,
    startPolling,
    stopPolling
  };
}

// Specialized hook for blockchain data
export function useBlockchainPolling<T>(
  fetchFunction: () => Promise<T>,
  options: UsePollingOptions = {}
) {
  return usePolling(fetchFunction, {
    interval: 30000, // Default 30 seconds for blockchain data
    ...options
  });
}
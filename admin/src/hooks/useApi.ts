/**
 * Custom hook for making authenticated API calls with Clerk
 */

import { useAuth } from "@clerk/nextjs";
import { useState, useCallback } from "react";
import { ApiError } from "@/lib/api";

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
}

export function useApi<T>() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (
      apiCall: (token: string | null) => Promise<T>,
      options?: UseApiOptions<T>
    ): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        const data = await apiCall(token);
        
        if (options?.onSuccess) {
          options.onSuccess(data);
        }
        
        return data;
      } catch (err) {
        const apiError = err as ApiError;
        const errorMessage = apiError.error || apiError.detail || "An error occurred";
        setError(errorMessage);
        
        if (options?.onError) {
          options.onError(apiError);
        }
        
        console.error("API Error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  return {
    execute,
    loading,
    error,
    clearError: () => setError(null),
  };
}



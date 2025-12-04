/**
 * Centralized API client for backend communication
 */

const getBackendUrl = (): string => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
};

export interface ApiError {
  error: string;
  detail?: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getBackendUrl();
  }

  /**
   * Make an authenticated API request
   */
  async request<T>(
    endpoint: string,
    options: RequestInit & { token?: string | null; timeout?: number } = {},
  ): Promise<T> {
    const { token, timeout = 30000, ...fetchOptions } = options;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(fetchOptions.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: headers as HeadersInit,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error(`Expected JSON response, got ${contentType}`);
      }

      const data = await response.json();

      if (!response.ok) {
        const error: ApiError = {
          error:
            data.error || `HTTP ${response.status}: ${response.statusText}`,
          detail:
            data.detail ||
            data.message ||
            data.error ||
            `HTTP ${response.status}: ${response.statusText}`,
        };
        throw error;
      }

      return data as T;
    } catch (error) {
      // Clear timeout on error
      clearTimeout(timeoutId);

      // Handle abort (timeout)
      if (error instanceof Error && error.name === "AbortError") {
        throw {
          error: "Request timeout",
          detail: `The request took longer than ${timeout}ms to complete. Please check your network connection and backend server.`,
        } as ApiError;
      }

      // If it's already an ApiError object, throw it as-is
      if (error && typeof error === "object" && "error" in error) {
        throw error;
      }
      // If it's a regular Error instance, convert it
      if (error instanceof Error) {
        // Check for common network errors
        if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError")
        ) {
          throw {
            error: "Network error",
            detail: `Unable to connect to backend server at ${this.baseUrl}. Please ensure the backend is running and accessible.`,
          } as ApiError;
        }
        throw {
          error: "Network error",
          detail: error.message,
        } as ApiError;
      }
      // For any other error type, convert to string
      throw {
        error: "Network error",
        detail: String(error),
      } as ApiError;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, token?: string | null): Promise<T> {
    return this.request<T>(endpoint, {
      method: "GET",
      token,
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    token?: string | null,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      token,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    token?: string | null,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      token,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, token?: string | null): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
      token,
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

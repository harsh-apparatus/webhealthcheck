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
    options: RequestInit & { token?: string | null } = {}
  ): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error(`Expected JSON response, got ${contentType}`);
      }

      const data = await response.json();

      if (!response.ok) {
        const error: ApiError = {
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
          detail: data.detail || data.message || data.error || `HTTP ${response.status}: ${response.statusText}`
        };
        throw error;
      }

      return data as T;
    } catch (error) {
      // If it's already an ApiError object, throw it as-is
      if (error && typeof error === 'object' && 'error' in error) {
        throw error;
      }
      // If it's a regular Error instance, convert it
      if (error instanceof Error) {
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
    token?: string | null
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
    token?: string | null
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


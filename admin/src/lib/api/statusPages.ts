/**
 * Status Page API service
 */

import { apiClient } from "../api";

export interface StatusPageMonitor {
  id: number;
  monitorId: number;
  displayOrder: number;
  monitor: {
    id: number;
    name: string;
    url: string;
    isHttps: boolean;
    isActive: boolean;
  };
}

export interface StatusPage {
  id: number;
  userId: number;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  monitors: StatusPageMonitor[];
}

export interface CreateStatusPageRequest {
  name: string;
  slug: string;
  monitorIds?: number[];
}

export interface UpdateStatusPageRequest {
  name?: string;
  slug?: string;
  isActive?: boolean;
  monitorIds?: number[];
}

export interface GetStatusPagesResponse {
  statusPages: StatusPage[];
}

export interface GetStatusPageResponse {
  statusPage: StatusPage;
}

/**
 * Get all status pages for the authenticated user
 */
export async function getStatusPages(
  token: string | null,
): Promise<GetStatusPagesResponse> {
  return apiClient.get<GetStatusPagesResponse>("/api/status-pages", token);
}

/**
 * Get a single status page by ID
 */
export async function getStatusPage(
  id: number,
  token: string | null,
): Promise<GetStatusPageResponse> {
  return apiClient.get<GetStatusPageResponse>(`/api/status-pages/${id}`, token);
}

/**
 * Create a new status page
 */
export async function createStatusPage(
  data: CreateStatusPageRequest,
  token: string | null,
): Promise<GetStatusPageResponse> {
  return apiClient.post<GetStatusPageResponse>(
    "/api/status-pages",
    data,
    token,
  );
}

/**
 * Update a status page
 */
export async function updateStatusPage(
  id: number,
  data: UpdateStatusPageRequest,
  token: string | null,
): Promise<GetStatusPageResponse> {
  return apiClient.put<GetStatusPageResponse>(
    `/api/status-pages/${id}`,
    data,
    token,
  );
}

/**
 * Delete a status page
 */
export async function deleteStatusPage(
  id: number,
  token: string | null,
): Promise<void> {
  return apiClient.delete<void>(`/api/status-pages/${id}`, token);
}

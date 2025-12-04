/**
 * Monitor API service
 */

import { apiClient } from "../api";

export interface LastPing {
  latency: number | null;
  status: "up" | "down";
  statusCode: number | null;
  timestamp: string;
}

export interface Monitor {
  id: number;
  userId: number;
  name: string;
  url: string;
  isHttps: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastPing: LastPing | null;
}

export interface CreateMonitorRequest {
  name: string;
  url: string;
  isHttps?: boolean;
}

export interface CreateMonitorResponse {
  monitor: Monitor;
}

export interface GetMonitorsResponse {
  monitors: Monitor[];
}

/**
 * Create a new monitor
 */
export async function createMonitor(
  data: CreateMonitorRequest,
  token: string | null,
): Promise<CreateMonitorResponse> {
  return apiClient.post<CreateMonitorResponse>("/api/monitors", data, token);
}

/**
 * Get all monitors for the authenticated user
 */
export async function getMonitors(
  token: string | null,
): Promise<GetMonitorsResponse> {
  return apiClient.get<GetMonitorsResponse>("/api/monitors", token);
}

/**
 * Get a single monitor by ID
 */
export async function getMonitor(
  id: number,
  token: string | null,
): Promise<{ monitor: Monitor }> {
  return apiClient.get<{ monitor: Monitor }>(`/api/monitors/${id}`, token);
}

/**
 * Update a monitor
 */
export async function updateMonitor(
  id: number,
  data: Partial<CreateMonitorRequest>,
  token: string | null,
): Promise<{ monitor: Monitor }> {
  return apiClient.put<{ monitor: Monitor }>(
    `/api/monitors/${id}`,
    data,
    token,
  );
}

/**
 * Delete a monitor
 */
export async function deleteMonitor(
  id: number,
  token: string | null,
): Promise<void> {
  return apiClient.delete<void>(`/api/monitors/${id}`, token);
}

export interface MonitorDetails {
  id: number;
  userId: number;
  name: string;
  url: string;
  isHttps: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  statistics: {
    totalPings: number;
    upPings: number;
    downPings: number;
    uptimePercentage: number;
    averageResponseTime: number | null;
    firstPing: string | null;
    lastPing: string | null;
  };
  lastPing: {
    id: number;
    latency: number | null;
    status: "up" | "down";
    statusCode: number | null;
    bodySnippet: string | null;
    timestamp: string;
  } | null;
}

export interface MonitorDetailsResponse {
  monitor: MonitorDetails;
}

/**
 * Get detailed information about a monitor including statistics
 */
export async function getMonitorDetails(
  id: number,
  token: string | null,
): Promise<MonitorDetailsResponse> {
  return apiClient.get<MonitorDetailsResponse>(
    `/api/monitors/${id}/details`,
    token,
  );
}

export interface MonitorLog {
  id: number;
  monitorId: number;
  latency: number | null;
  statusCode: number | null;
  status: "up" | "down";
  bodySnippet: string | null;
  timestamp: string;
}

export interface MonitorLogsResponse {
  logs: MonitorLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface GetMonitorLogsParams {
  page?: number;
  limit?: number;
  status?: "up" | "down";
  startDate?: string;
  endDate?: string;
}

/**
 * Get paginated logs for a monitor
 */
export async function getMonitorLogs(
  id: number,
  params: GetMonitorLogsParams,
  token: string | null,
): Promise<MonitorLogsResponse> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.status) queryParams.append("status", params.status);
  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);

  const queryString = queryParams.toString();
  const url = `/api/monitors/${id}/logs${queryString ? `?${queryString}` : ""}`;

  return apiClient.get<MonitorLogsResponse>(url, token);
}

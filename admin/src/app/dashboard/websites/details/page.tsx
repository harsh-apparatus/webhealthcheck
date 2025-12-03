"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import ButtonPrimary from "@/components/button/ButtonPrimary";
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaClock, FaTrash, FaEdit, FaLock, FaUnlock } from "react-icons/fa";
import {
  getMonitorDetails,
  getMonitorLogs,
  deleteMonitor,
  MonitorDetails,
  MonitorLog,
} from "@/lib/api/monitors";
import { ApiError } from "@/lib/api";
import { useNotification } from "@/contexts/NotificationContext";
import { useLoader } from "@/contexts/LoaderContext";
import CustomTable, { ColumnType } from "@/components/customTable/CustomTable";
import { Input } from "antd";

const page = () => {
  const { getToken } = useAuth();
  const { showNotification } = useNotification();
  const { setLoading } = useLoader();
  const router = useRouter();
  const searchParams = useSearchParams();
  const monitorId = searchParams.get("id");

  const [monitorDetails, setMonitorDetails] = useState<MonitorDetails | null>(null);
  const [logs, setLogs] = useState<MonitorLog[]>([]);
  const [loading, setLocalLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Fetch monitor details
  useEffect(() => {
    const fetchDetails = async () => {
      if (!monitorId) {
        showNotification("Error", "error", "No monitor ID provided");
        router.push("/dashboard/websites");
        return;
      }

      setFetching(true);
      try {
        const token = await getToken();
        if (!token) {
          showNotification("Authentication Error", "error", "No authentication token available. Please sign in.");
          router.push("/dashboard/websites");
          return;
        }

        const data = await getMonitorDetails(parseInt(monitorId), token);
        setMonitorDetails(data.monitor);
      } catch (err) {
        const apiError = err as ApiError;
        const errorMessage = apiError.error || apiError.detail || "Failed to load monitor details";
        showNotification("Failed to load details", "error", errorMessage);
        console.error("API Error:", err);
        router.push("/dashboard/websites");
      } finally {
        setFetching(false);
      }
    };

    fetchDetails();
  }, [monitorId, getToken, showNotification, router]);

  // Fetch logs for graph and table
  useEffect(() => {
    const fetchLogs = async () => {
      if (!monitorId) return;

      setLogsLoading(true);
      try {
        const token = await getToken();
        if (!token) return;

        // Fetch more logs for graph (last 50)
        const data = await getMonitorLogs(
          parseInt(monitorId),
          {
            page: currentPage,
            limit: 50,
          },
          token
        );
        setLogs(data.logs);
        setPagination(data.pagination);
      } catch (err) {
        const apiError = err as ApiError;
        const errorMessage = apiError.error || apiError.detail || "Failed to load logs";
        showNotification("Failed to load logs", "error", errorMessage);
        console.error("API Error:", err);
      } finally {
        setLogsLoading(false);
      }
    };

    fetchLogs();
  }, [monitorId, currentPage, getToken, showNotification]);

  const handleDelete = async () => {
    if (!monitorId) return;

    if (!confirm("Are you sure you want to delete this monitor? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        showNotification("Authentication Error", "error", "No authentication token available. Please sign in.");
        return;
      }

      await deleteMonitor(parseInt(monitorId), token);
      showNotification("Success", "success", "Monitor deleted successfully");
      router.push("/dashboard/websites");
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.detail || apiError.error || "Failed to delete monitor";
      showNotification("Failed to delete monitor", "error", errorMessage);
      console.error("API Error:", err);
    } finally {
      setDeleting(false);
      setLoading(false);
    }
  };

  const getStatusBadge = (status: "up" | "down") => {
    if (status === "up") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-success/20 border border-success/50 text-success">
          <FaCheckCircle className="text-xs" />
          Up
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-error/20 border border-error/50 text-error">
        <FaTimesCircle className="text-xs" />
        Down
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatLatency = (latency: number | null) => {
    if (latency === null) return "—";
    return `${latency}ms`;
  };

  // Prepare graph data (last 30 logs for visualization)
  const graphData = logs.slice(0, 30).reverse();
  const maxLatency = Math.max(...graphData.map(log => log.latency || 0), 100);

  const logColumns: ColumnType<MonitorLog>[] = [
    {
      title: "Status",
      key: "status",
      dataIndex: "status",
      render: (_, record) => getStatusBadge(record.status),
      filters: [
        { text: "Up", value: "up" },
        { text: "Down", value: "down" },
      ],
      onFilter: (value, record) => record.status === value,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                setSelectedKeys([]);
                clearFilters?.();
                confirm();
              }}
              style={{ padding: "4px 8px", background: "#1e1e1e", color: "#dedede", border: "1px solid #3f3f3f", borderRadius: "4px", cursor: "pointer" }}
            >
              Reset
            </button>
          </div>
        </div>
      ),
    },
    {
      title: "Timestamp",
      key: "timestamp",
      dataIndex: "timestamp",
      render: (_, record) => (
        <div className="text-text">
          <div className="flex items-center gap-2">
            <FaClock className="text-xs opacity-70" />
            <span className="text-white">{formatDate(record.timestamp)}</span>
          </div>
        </div>
      ),
      sorter: (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search timestamp"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => confirm()}
              style={{ padding: "4px 8px", background: "#7d02e1", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              Search
            </button>
            <button
              onClick={() => {
                clearFilters?.();
                confirm();
              }}
              style={{ padding: "4px 8px", background: "#1e1e1e", color: "#dedede", border: "1px solid #3f3f3f", borderRadius: "4px", cursor: "pointer" }}
            >
              Reset
            </button>
          </div>
        </div>
      ),
      onFilter: (value, record) =>
        formatDate(record.timestamp).toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: "Response Time",
      key: "latency",
      dataIndex: "latency",
      render: (_, record) => (
        <div className="text-text">
          <span className="text-white font-medium">{formatLatency(record.latency)}</span>
        </div>
      ),
      sorter: (a, b) => {
        const aLatency = a.latency ?? 0;
        const bLatency = b.latency ?? 0;
        return aLatency - bLatency;
      },
    },
    {
      title: "Status Code",
      key: "statusCode",
      dataIndex: "statusCode",
      render: (_, record) => (
        <div className="text-text">
          <span className="text-white">{record.statusCode || "—"}</span>
        </div>
      ),
      sorter: (a, b) => {
        const aCode = a.statusCode ?? 0;
        const bCode = b.statusCode ?? 0;
        return aCode - bCode;
      },
      filters: [
        { text: "200", value: 200 },
        { text: "404", value: 404 },
        { text: "500", value: 500 },
      ],
      onFilter: (value, record) => record.statusCode === value,
    },
    {
      title: "Response",
      key: "bodySnippet",
      dataIndex: "bodySnippet",
      render: (_, record) => (
        <div className="text-text">
          <span className="text-text/60 text-sm max-w-xs truncate block">
            {record.bodySnippet || "—"}
          </span>
        </div>
      ),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search response"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => confirm()}
              style={{ padding: "4px 8px", background: "#7d02e1", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              Search
            </button>
            <button
              onClick={() => {
                clearFilters?.();
                confirm();
              }}
              style={{ padding: "4px 8px", background: "#1e1e1e", color: "#dedede", border: "1px solid #3f3f3f", borderRadius: "4px", cursor: "pointer" }}
            >
              Reset
            </button>
          </div>
        </div>
      ),
      onFilter: (value, record) =>
        (record.bodySnippet || "").toLowerCase().includes(String(value).toLowerCase()),
    },
  ];

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-text">Loading monitor details...</div>
      </div>
    );
  }

  if (!monitorDetails) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-error">Monitor not found</div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div>
        <div className="flex justify-between my-10 items-center border-b border-border pb-4">
          <h1 className="h2">Monitor Details</h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => router.push(`/dashboard/websites/edit?id=${monitorId}`)}
              className="px-4 py-2 bg-background-secondary hover:bg-background-secondary/80 border border-border text-text rounded transition-colors flex items-center gap-2"
            >
              <FaEdit />
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-error/20 hover:bg-error/30 border border-error/50 text-error rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FaTrash />
              {deleting ? "Deleting..." : "Delete"}
            </button>
            <ButtonPrimary
              name="Back"
              icon={<FaArrowLeft />}
              link="/dashboard/websites"
            />
          </div>
        </div>
      </div>

      {/* Website Information Card */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-text/60 text-sm block mb-1">Website Name</label>
            <p className="text-white font-semibold text-lg">{monitorDetails.name}</p>
          </div>
          <div>
            <label className="text-text/60 text-sm block mb-1">URL</label>
            <p className="text-text break-all">{monitorDetails.url}</p>
          </div>
          <div>
            <label className="text-text/60 text-sm block mb-1">Status</label>
            <div className="mt-1">
              {monitorDetails.isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-success/20 border border-success/50 text-success">
                  <FaCheckCircle className="text-xs" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-error/20 border border-error/50 text-error">
                  <FaTimesCircle className="text-xs" />
                  Inactive
                </span>
              )}
            </div>
          </div>
          <div>
            <label className="text-text/60 text-sm block mb-1">Last Ping</label>
            <p className="text-text">
              {monitorDetails.lastPing
                ? formatDate(monitorDetails.lastPing.timestamp)
                : "Never"}
            </p>
          </div>
          <div>
            <label className="text-text/60 text-sm block mb-1">Protocol</label>
            <div className="mt-1">
              {monitorDetails.isHttps ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-success/20 border border-success/50 text-success">
                  <FaLock className="text-xs" />
                  HTTPS
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray border border-border text-text">
                  <FaUnlock className="text-xs" />
                  HTTP
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards - Highlighted */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card-highlight p-6">
          <label className="text-text/60 text-sm block mb-2">Total Pings</label>
          <p className="text-3xl font-bold text-white">
            {monitorDetails.statistics.totalPings}
          </p>
        </div>
        <div className="card-highlight p-6">
          <label className="text-text/60 text-sm block mb-2">Uptime</label>
          <p className="text-3xl font-bold text-success">
            {monitorDetails.statistics.uptimePercentage}%
          </p>
        </div>
        <div className="card-highlight p-6">
          <label className="text-text/60 text-sm block mb-2">Average Response</label>
          <p className="text-3xl font-bold text-white">
            {monitorDetails.statistics.averageResponseTime
              ? `${monitorDetails.statistics.averageResponseTime}ms`
              : "N/A"}
          </p>
        </div>
        <div className="card-highlight p-6">
          <label className="text-text/60 text-sm block mb-2">Down Pings</label>
          <p className="text-3xl font-bold text-error">
            {monitorDetails.statistics.downPings}
          </p>
        </div>
      </div>

      {/* Graph Section */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Response Time Trend</h2>
        {graphData.length > 0 ? (
          <div className="w-full h-64 relative">
            <svg width="100%" height="100%" className="overflow-visible">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--success)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--success)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((percent) => (
                <line
                  key={percent}
                  x1="0%"
                  y1={`${percent}%`}
                  x2="100%"
                  y2={`${percent}%`}
                  stroke="var(--border)"
                  strokeWidth="1"
                  strokeDasharray="4"
                />
              ))}
              {/* Area under curve */}
              <path
                d={`M 0 ${100 - (graphData[0]?.latency || 0) / maxLatency * 100} ${graphData.map((log, i) => {
                  const x = (i / (graphData.length - 1)) * 100;
                  const y = 100 - ((log.latency || 0) / maxLatency) * 100;
                  return `L ${x} ${y}`;
                }).join(' ')} L ${100} 100 L 0 100 Z`}
                fill="url(#lineGradient)"
              />
              {/* Line */}
              <polyline
                points={graphData.map((log, i) => {
                  const x = (i / (graphData.length - 1 || 1)) * 100;
                  const y = 100 - ((log.latency || 0) / maxLatency) * 100;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="var(--success)"
                strokeWidth="2"
              />
              {/* Data points */}
              {graphData.map((log, i) => {
                const x = (i / (graphData.length - 1 || 1)) * 100;
                const y = 100 - ((log.latency || 0) / maxLatency) * 100;
                return (
                  <circle
                    key={i}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill={log.status === "up" ? "var(--success)" : "var(--error)"}
                    stroke="var(--bg)"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-text/60 pr-2">
              <span>{maxLatency}ms</span>
              <span>{Math.round(maxLatency * 0.75)}ms</span>
              <span>{Math.round(maxLatency * 0.5)}ms</span>
              <span>{Math.round(maxLatency * 0.25)}ms</span>
              <span>0ms</span>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-text/60">
            No data available for graph
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="mt-8">
        <CustomTable
          data={logs}
          columns={logColumns}
          loading={logsLoading}
          emptyMessage="No logs found"
          pageSize={pagination.limit}
          enablePagination={true}
          currentPage={currentPage}
          total={pagination.total}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </>
  );
};

export default page;

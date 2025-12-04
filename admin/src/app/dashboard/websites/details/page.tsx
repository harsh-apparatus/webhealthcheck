"use client";

import { useAuth } from "@clerk/nextjs";
import { Input } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaClock,
  FaEdit,
  FaLock,
  FaTimesCircle,
  FaTrash,
  FaUnlock,
} from "react-icons/fa";
import ButtonPrimary from "@/components/button/ButtonPrimary";
import CustomTable, {
  type ColumnType,
} from "@/components/customTable/CustomTable";
import DeleteConfirmModal from "@/components/modal/DeleteConfirmModal";
import { useLoader } from "@/contexts/LoaderContext";
import { useNotification } from "@/contexts/NotificationContext";
import type { ApiError } from "@/lib/api";
import {
  deleteMonitor,
  getMonitorDetails,
  getMonitorLogs,
  type MonitorDetails,
  type MonitorLog,
} from "@/lib/api/monitors";

const page = () => {
  const { getToken } = useAuth();
  const { showNotification } = useNotification();
  const { setLoading } = useLoader();
  const router = useRouter();
  const searchParams = useSearchParams();
  const monitorId = searchParams.get("id");

  const [monitorDetails, setMonitorDetails] = useState<MonitorDetails | null>(
    null,
  );
  const [logs, setLogs] = useState<MonitorLog[]>([]);
  const [_loading, _setLocalLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
          showNotification(
            "Authentication Error",
            "error",
            "No authentication token available. Please sign in.",
          );
          router.push("/dashboard/websites");
          return;
        }

        const data = await getMonitorDetails(parseInt(monitorId, 10), token);
        setMonitorDetails(data.monitor);
      } catch (err) {
        const apiError = err as ApiError;
        const errorMessage =
          apiError.error || apiError.detail || "Failed to load monitor details";
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
          parseInt(monitorId, 10),
          {
            page: currentPage,
            limit: 50,
          },
          token,
        );
        setLogs(data.logs);
        setPagination(data.pagination);
      } catch (err) {
        const apiError = err as ApiError;
        const errorMessage =
          apiError.error || apiError.detail || "Failed to load logs";
        showNotification("Failed to load logs", "error", errorMessage);
        console.error("API Error:", err);
      } finally {
        setLogsLoading(false);
      }
    };

    fetchLogs();
  }, [monitorId, currentPage, getToken, showNotification]);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!monitorId) return;

    setDeleting(true);
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        showNotification(
          "Authentication Error",
          "error",
          "No authentication token available. Please sign in.",
        );
        setShowDeleteModal(false);
        return;
      }

      await deleteMonitor(parseInt(monitorId, 10), token);
      showNotification(
        "Success",
        "success",
        "Monitor and all associated logs deleted successfully",
      );
      setShowDeleteModal(false);
      router.push("/dashboard/websites");
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage =
        apiError.detail || apiError.error || "Failed to delete monitor";
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
  const maxLatency = Math.max(...graphData.map((log) => log.latency || 0), 100);

  // Calculate date range for graph
  const getDateRange = () => {
    if (graphData.length === 0) return null;
    const dates = graphData.map((log) => new Date(log.timestamp));
    const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
    const latest = new Date(Math.max(...dates.map((d) => d.getTime())));
    return { earliest, latest };
  };

  const dateRange = getDateRange();

  const logColumns: ColumnType<MonitorLog>[] = [
    {
      title: "Status",
      key: "status",
      dataIndex: "status",
      render: (_, record) => getStatusBadge(record.status),
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search status (up/down)"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => confirm()}
              style={{
                padding: "4px 8px",
                background: "#7d02e1",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                clearFilters?.();
                confirm();
              }}
              style={{
                padding: "4px 8px",
                background: "#1e1e1e",
                color: "#dedede",
                border: "1px solid #3f3f3f",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>
        </div>
      ),
      onFilter: (value, record) =>
        record.status.toLowerCase().includes(String(value).toLowerCase()),
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
      sorter: (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search timestamp"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => confirm()}
              style={{
                padding: "4px 8px",
                background: "#7d02e1",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                clearFilters?.();
                confirm();
              }}
              style={{
                padding: "4px 8px",
                background: "#1e1e1e",
                color: "#dedede",
                border: "1px solid #3f3f3f",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>
        </div>
      ),
      onFilter: (value, record) =>
        formatDate(record.timestamp)
          .toLowerCase()
          .includes(String(value).toLowerCase()),
    },
    {
      title: "Response Time",
      key: "latency",
      dataIndex: "latency",
      render: (_, record) => (
        <div className="text-text">
          <span className="text-white font-medium">
            {formatLatency(record.latency)}
          </span>
        </div>
      ),
      sorter: (a, b) => {
        const aLatency = a.latency ?? 0;
        const bLatency = b.latency ?? 0;
        return aLatency - bLatency;
      },
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search response time"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => confirm()}
              style={{
                padding: "4px 8px",
                background: "#7d02e1",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                clearFilters?.();
                confirm();
              }}
              style={{
                padding: "4px 8px",
                background: "#1e1e1e",
                color: "#dedede",
                border: "1px solid #3f3f3f",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>
        </div>
      ),
      onFilter: (value, record) =>
        formatLatency(record.latency)
          .toLowerCase()
          .includes(String(value).toLowerCase()),
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
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search status code"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => confirm()}
              style={{
                padding: "4px 8px",
                background: "#7d02e1",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                clearFilters?.();
                confirm();
              }}
              style={{
                padding: "4px 8px",
                background: "#1e1e1e",
                color: "#dedede",
                border: "1px solid #3f3f3f",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>
        </div>
      ),
      onFilter: (value, record) =>
        String(record.statusCode || "").includes(String(value)),
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
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search response"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => confirm()}
              style={{
                padding: "4px 8px",
                background: "#7d02e1",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                clearFilters?.();
                confirm();
              }}
              style={{
                padding: "4px 8px",
                background: "#1e1e1e",
                color: "#dedede",
                border: "1px solid #3f3f3f",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>
        </div>
      ),
      onFilter: (value, record) =>
        (record.bodySnippet || "")
          .toLowerCase()
          .includes(String(value).toLowerCase()),
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
              type="button"
              onClick={() =>
                router.push(`/dashboard/websites/edit?id=${monitorId}`)
              }
              className="px-4 py-2 bg-background-secondary hover:bg-background-secondary/80 border border-border text-text rounded transition-colors flex items-center gap-2"
            >
              <FaEdit />
              Edit
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={deleting}
              className="px-4 py-2 bg-error/20 hover:bg-error/30 border border-error/50 text-error rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FaTrash />
              Delete
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
            <div className="text-text/60 text-sm block mb-1">Website Name</div>
            <p className="text-white font-semibold text-lg">
              {monitorDetails.name}
            </p>
          </div>
          <div>
            <div className="text-text/60 text-sm block mb-1">URL</div>
            <p className="text-text break-all">{monitorDetails.url}</p>
          </div>
          <div>
            <div className="text-text/60 text-sm block mb-1">Status</div>
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
            <div className="text-text/60 text-sm block mb-1">Last Ping</div>
            <p className="text-text">
              {monitorDetails.lastPing
                ? formatDate(monitorDetails.lastPing.timestamp)
                : "Never"}
            </p>
          </div>
          <div>
            <div className="text-text/60 text-sm block mb-1">Protocol</div>
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
          <div className="text-text/60 text-sm block mb-2">Total Pings</div>
          <p className="text-3xl font-bold text-white">
            {monitorDetails.statistics.totalPings}
          </p>
        </div>
        <div className="card-highlight p-6">
          <div className="text-text/60 text-sm block mb-2">Uptime</div>
          <p className="text-3xl font-bold text-success">
            {monitorDetails.statistics.uptimePercentage}%
          </p>
        </div>
        <div className="card-highlight p-6">
          <div className="text-text/60 text-sm block mb-2">
            Average Response
          </div>
          <p className="text-3xl font-bold text-white">
            {monitorDetails.statistics.averageResponseTime
              ? `${monitorDetails.statistics.averageResponseTime}ms`
              : "N/A"}
          </p>
        </div>
        <div className="card-highlight p-6">
          <div className="text-text/60 text-sm block mb-2">Down Pings</div>
          <p className="text-3xl font-bold text-error">
            {monitorDetails.statistics.downPings}
          </p>
        </div>
      </div>

      {/* Graph Section */}
      <div className="card mb-6 w-full">
        <div className="p-6 pb-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">Response Time Trend</h2>
            {dateRange && (
              <div className="text-sm text-text/60 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-text/80">
                    {dateRange.earliest.toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    {dateRange.earliest.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span>→</span>
                  <span className="text-text/80">
                    {dateRange.latest.toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    {dateRange.latest.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <span className="text-text/60">
                  ({graphData.length} points)
                </span>
              </div>
            )}
          </div>
        </div>
        {graphData.length > 0 ? (
          <div className="px-6 pb-6">
            <div
              className="w-full h-64 relative pb-6"
              style={{ width: "100%" }}
            >
              {/* Y-axis labels */}
              <div
                className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-text/60 pr-4 z-10"
                style={{ width: "60px" }}
              >
                <span>{maxLatency}ms</span>
                <span>{Math.round(maxLatency * 0.75)}ms</span>
                <span>{Math.round(maxLatency * 0.5)}ms</span>
                <span>{Math.round(maxLatency * 0.25)}ms</span>
                <span>0ms</span>
              </div>
              {/* Graph SVG - positioned to take remaining space */}
              <div
                className="absolute left-0 top-0 right-0 bottom-0"
                style={{ left: "60px", width: "calc(100% - 60px)" }}
              >
                <svg
                  viewBox="0 0 1000 256"
                  preserveAspectRatio="none"
                  style={{ display: "block", width: "100%", height: "100%" }}
                  role="img"
                  aria-label="Response time graph"
                >
                  <defs>
                    <linearGradient
                      id={`lineGradient-${monitorId}`}
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--success)"
                        stopOpacity="0.3"
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--success)"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((percent) => (
                    <line
                      key={percent}
                      x1="0"
                      y1={(percent / 100) * 256}
                      x2="1000"
                      y2={(percent / 100) * 256}
                      stroke="var(--border)"
                      strokeWidth="1"
                      strokeDasharray="4"
                    />
                  ))}
                  {/* Area under curve */}
                  <path
                    d={`M 0 ${256 - ((graphData[0]?.latency || 0) / maxLatency) * 256} ${graphData
                      .map((log, i) => {
                        const x = (i / (graphData.length - 1 || 1)) * 1000;
                        const y = 256 - ((log.latency || 0) / maxLatency) * 256;
                        return `L ${x} ${y}`;
                      })
                      .join(" ")} L 1000 256 L 0 256 Z`}
                    fill={`url(#lineGradient-${monitorId})`}
                  />
                  {/* Line */}
                  <polyline
                    points={graphData
                      .map((log, i) => {
                        const x = (i / (graphData.length - 1 || 1)) * 1000;
                        const y = 256 - ((log.latency || 0) / maxLatency) * 256;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                    fill="none"
                    stroke="var(--success)"
                    strokeWidth="2"
                  />
                  {/* Data points */}
                  {graphData.map((log, i) => {
                    const x = (i / (graphData.length - 1 || 1)) * 1000;
                    const y = 256 - ((log.latency || 0) / maxLatency) * 256;
                    return (
                      <circle
                        key={`${log.timestamp || i}-${x}-${y}`}
                        cx={x}
                        cy={y}
                        r="4"
                        fill={
                          log.status === "up"
                            ? "var(--success)"
                            : "var(--error)"
                        }
                        stroke="var(--bg)"
                        strokeWidth="2"
                      />
                    );
                  })}
                </svg>
              </div>
              {/* X-axis time labels */}
              {dateRange && graphData.length > 0 && (
                <div
                  className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-text/60 px-0"
                  style={{
                    left: "60px",
                    width: "calc(100% - 60px)",
                    paddingTop: "8px",
                  }}
                >
                  <span>
                    {dateRange.earliest.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {graphData.length > 2 && (
                    <span>
                      {new Date(
                        graphData[Math.floor(graphData.length / 2)].timestamp,
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                  <span>
                    {dateRange.latest.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-text/60 px-6 pb-6">
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Website Monitor"
        message="Are you sure you want to delete this website monitor? This will permanently delete:"
        itemName={
          monitorDetails
            ? `${monitorDetails.name} (${monitorDetails.url})`
            : undefined
        }
        isLoading={deleting}
      />
    </>
  );
};

export default page;

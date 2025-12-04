"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useLoader } from "@/contexts/LoaderContext";
import { useNotification } from "@/contexts/NotificationContext";
import { getMonitors, getMonitorLogs, Monitor, MonitorLog } from "@/lib/api/monitors";
import { ApiError } from "@/lib/api";
import CustomTable, { ColumnType } from "@/components/customTable/CustomTable";
import ButtonPrimary from "@/components/button/ButtonPrimary";
import { FaCheckCircle, FaTimesCircle, FaClock, FaArrowLeft } from "react-icons/fa";
import { Select, Input } from "antd";

const page = () => {
  const { getToken } = useAuth();
  const { setLoading } = useLoader();
  const { showNotification } = useNotification();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [selectedMonitorId, setSelectedMonitorId] = useState<number | null>(null);
  const [logs, setLogs] = useState<MonitorLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Fetch monitors on mount
  useEffect(() => {
    const fetchMonitors = async () => {
      try {
        setIsLoading(true);
        setLoading(true);
        const token = await getToken();

        if (!token) {
          throw new Error("Authentication token not available");
        }

        const monitorsResponse = await getMonitors(token);
        setMonitors(monitorsResponse.monitors);
      } catch (err) {
        console.error("Failed to fetch monitors:", err);
        const apiError = err as ApiError;
        const errorMessage =
          apiError.error || apiError.detail || (err instanceof Error ? err.message : "Failed to fetch monitors");
        showNotification("Error", "error", errorMessage);
      } finally {
        setIsLoading(false);
        setLoading(false);
      }
    };

    fetchMonitors();
  }, [getToken, showNotification, setLoading]);

  // Fetch logs when monitor is selected
  useEffect(() => {
    const fetchLogs = async () => {
      if (!selectedMonitorId) {
        setLogs([]);
        return;
      }

      try {
        setIsLoading(true);
        setLoading(true);
        const token = await getToken();

        if (!token) {
          throw new Error("Authentication token not available");
        }

        const data = await getMonitorLogs(
          selectedMonitorId,
          {
            page: currentPage,
            limit: 50,
          },
          token
        );
        setLogs(data.logs);
        setPagination(data.pagination);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
        const apiError = err as ApiError;
        const errorMessage =
          apiError.error || apiError.detail || (err instanceof Error ? err.message : "Failed to fetch logs");
        showNotification("Error", "error", errorMessage);
        setLogs([]);
      } finally {
        setIsLoading(false);
        setLoading(false);
      }
    };

    fetchLogs();
  }, [selectedMonitorId, currentPage, getToken, showNotification, setLoading]);

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

  const logColumns: ColumnType<MonitorLog>[] = [
    {
      title: "Status",
      key: "status",
      dataIndex: "status",
      render: (_, record) => getStatusBadge(record.status),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search status (up/down)"
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
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search response time"
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
        formatLatency(record.latency).toLowerCase().includes(String(value).toLowerCase()),
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
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search status code"
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

  const selectedMonitor = monitors.find((m) => m.id === selectedMonitorId);

  return (
    <>
      <div className="flex justify-between my-10 items-center border-b border-border pb-4">
        <h1 className="h2">Logs</h1>
        <ButtonPrimary
          name="Back"
          icon={<FaArrowLeft />}
          link="/dashboard"
        />
      </div>

      <div className="flex flex-col gap-6">
        <div className="card p-4">
          <div className="flex flex-col gap-4">
            <label htmlFor="monitor-select" className="text-sm font-medium text-white">
              Select Website
            </label>
            <Select
              id="monitor-select"
              value={selectedMonitorId}
              onChange={(value) => {
                setSelectedMonitorId(value);
                setCurrentPage(1); // Reset to first page when changing monitor
              }}
              placeholder="Select a website"
              className="w-full"
              size="large"
              options={monitors.map((monitor) => ({
                value: monitor.id,
                label: `${monitor.name} (${monitor.url})`,
              }))}
              style={{
                width: "100%",
              }}
            />
            {selectedMonitor && (
              <p className="text-xs text-text">
                Showing logs for: <span className="text-white font-medium">{selectedMonitor.name}</span>
              </p>
            )}
          </div>
        </div>

        {selectedMonitorId ? (
          <CustomTable
            data={logs}
            columns={logColumns}
            loading={isLoading}
            emptyMessage="No logs found for this website"
            pageSize={pagination.limit}
            enablePagination={true}
            currentPage={pagination.page}
            total={pagination.total}
            onPageChange={(page) => setCurrentPage(page)}
          />
        ) : (
          <div className="card p-8 text-center">
            <p className="text-text">Please select a website to view logs</p>
          </div>
        )}
      </div>
    </>
  );
};

export default page;


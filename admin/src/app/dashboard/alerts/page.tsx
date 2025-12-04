"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useLoader } from "@/contexts/LoaderContext";
import { useNotification } from "@/contexts/NotificationContext";
import { getMonitors, getMonitorLogs, Monitor, MonitorLog } from "@/lib/api/monitors";
import { ApiError } from "@/lib/api";
import CustomTable, { ColumnType } from "@/components/customTable/CustomTable";
import { FaTimesCircle, FaClock, FaExternalLinkAlt } from "react-icons/fa";
import { Input } from "antd";
import Link from "next/link";

interface AlertLog extends MonitorLog {
  monitorName: string;
  monitorUrl: string;
}

const page = () => {
  const { getToken } = useAuth();
  const { setLoading } = useLoader();
  const { showNotification } = useNotification();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
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

  // Fetch monitors and alerts on mount
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setIsLoading(true);
        setLoading(true);
        const token = await getToken();

        if (!token) {
          throw new Error("Authentication token not available");
        }

        // Fetch all monitors
        const monitorsResponse = await getMonitors(token);
        setMonitors(monitorsResponse.monitors);

        // Fetch down logs from all active monitors
        const activeMonitors = monitorsResponse.monitors.filter((m) => m.isActive);
        
        if (activeMonitors.length === 0) {
          setAlerts([]);
          setPagination({
            page: 1,
            limit: 50,
            total: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          });
          return;
        }

        // Fetch down logs from all monitors in parallel
        const logPromises = activeMonitors.map((monitor) =>
          getMonitorLogs(
            monitor.id,
            {
              page: 1,
              limit: 1000, // Get more logs to aggregate
              status: "down",
            },
            token
          ).catch((err) => {
            console.warn(`Failed to fetch alerts for monitor ${monitor.id}:`, err);
            return { logs: [], pagination: { page: 1, limit: 1000, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
          })
        );

        const logResponses = await Promise.all(logPromises);
        
        // Combine all down logs and add monitor info
        const allAlerts: AlertLog[] = [];
        logResponses.forEach((response, index) => {
          const monitor = activeMonitors[index];
          response.logs.forEach((log) => {
            allAlerts.push({
              ...log,
              monitorName: monitor.name,
              monitorUrl: monitor.url,
            });
          });
        });

        // Sort by timestamp (newest first)
        allAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Implement pagination manually
        const pageSize = 50;
        const total = allAlerts.length;
        const totalPages = Math.ceil(total / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedAlerts = allAlerts.slice(startIndex, endIndex);

        setAlerts(paginatedAlerts);
        setPagination({
          page: currentPage,
          limit: pageSize,
          total,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        });
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
        const apiError = err as ApiError;
        const errorMessage =
          apiError.error || apiError.detail || (err instanceof Error ? err.message : "Failed to fetch alerts");
        showNotification("Error", "error", errorMessage);
        setAlerts([]);
      } finally {
        setIsLoading(false);
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [currentPage, getToken, showNotification, setLoading]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatLatency = (latency: number | null) => {
    if (latency === null) return "—";
    return `${latency}ms`;
  };

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch {
      return url.length > 40 ? url.substring(0, 37) + "..." : url;
    }
  };

  const alertColumns: ColumnType<AlertLog>[] = [
    {
      title: "Website",
      key: "monitorName",
      dataIndex: "monitorName",
      render: (_, record) => (
        <div className="flex flex-col gap-1">
          <Link
            href={`/dashboard/websites/details?id=${record.monitorId}`}
            className="text-white font-medium hover:text-accent transition-colors"
          >
            {record.monitorName}
          </Link>
          <div className="flex items-center gap-2 text-sm text-text">
            <span className="truncate">{formatUrl(record.monitorUrl)}</span>
            <a
              href={record.monitorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent/80 shrink-0"
            >
              <FaExternalLinkAlt className="text-xs" />
            </a>
          </div>
        </div>
      ),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search website"
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
        (record.monitorName || "").toLowerCase().includes(String(value).toLowerCase()) ||
        (record.monitorUrl || "").toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "status",
      render: () => (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-error/20 border border-error/50 text-error">
          <FaTimesCircle className="text-xs" />
          Down
        </span>
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

  return (
    <>
      <div className="flex justify-between my-10 items-center border-b border-border pb-4">
        <h1 className="h2">Alerts</h1>
      </div>

      <div className="flex flex-col gap-6">
        <div className="card p-4">
          <p className="text-sm text-text">
            Showing all down status alerts from all active websites. Alerts are sorted by most recent first.
          </p>
        </div>

        <CustomTable
          data={alerts}
          columns={alertColumns}
          loading={isLoading}
          emptyMessage="No alerts found. All websites are up!"
          pageSize={50}
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </>
  );
};

export default page;


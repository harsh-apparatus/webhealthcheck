"use client";

import Link from "next/link";
import { Monitor } from "@/lib/api/monitors";
import { FaExternalLinkAlt, FaCheckCircle, FaTimesCircle, FaClock, FaEdit, FaLock, FaUnlock, FaList } from "react-icons/fa";
import CustomTable from "@/components/customTable/CustomTable";
import type { ColumnType } from "antd/es/table";
import { Input, Tooltip } from "antd";

interface WebsitesTableProps {
  monitors: Monitor[];
  loading?: boolean;
}

const WebsitesTable = ({ monitors, loading = false }: WebsitesTableProps) => {
  const getStatusBadge = (monitor: Monitor) => {
    if (!monitor.isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray border border-border">
          <FaClock className="text-xs" />
          Inactive
        </span>
      );
    }

    if (!monitor.lastPing) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray border border-border">
          <FaClock className="text-xs" />
          No data
        </span>
      );
    }

    if (monitor.lastPing.status === "up") {
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

  const formatLatency = (latency: number | null) => {
    if (latency === null) return "—";
    return `${latency}ms`;
  };

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const fullPath = urlObj.hostname + urlObj.pathname;
      // Truncate if too long
      if (fullPath.length > 40) {
        return fullPath.substring(0, 37) + "...";
      }
      return fullPath;
    } catch {
      // If URL parsing fails, just truncate the original string
      return url.length > 40 ? url.substring(0, 37) + "..." : url;
    }
  };

  const getHttpsBadge = (isHttps: boolean) => {
    if (isHttps) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-success/20 border border-success/50 text-success">
          <FaLock className="text-xs" />
          HTTPS
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray border border-border text-text">
        <FaUnlock className="text-xs" />
        HTTP
      </span>
    );
  };

  // Define columns using Ant Design Table ColumnType with filters, search, and sorting
  const columns: ColumnType<Monitor>[] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <div className="font-medium text-white">{text}</div>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search name"
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
        record.name.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      render: (url: string) => (
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text hover:text-white transition-colors flex items-center gap-1"
            title={url}
          >
            <span>{formatUrl(url)}</span>
            <FaExternalLinkAlt className="text-xs opacity-50 shrink-0" />
          </a>
        </div>
      ),
      sorter: (a, b) => a.url.localeCompare(b.url),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search URL"
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
        record.url.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: "Protocol",
      dataIndex: "isHttps",
      key: "isHttps",
      render: (isHttps: boolean) => getHttpsBadge(isHttps),
      sorter: (a, b) => Number(a.isHttps) - Number(b.isHttps),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search protocol (http/https)"
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
      onFilter: (value, record) => {
        const protocol = record.isHttps ? "https" : "http";
        return protocol.toLowerCase().includes(String(value).toLowerCase());
      },
    },
    {
      title: "Last Ping",
      key: "lastPing",
      render: (_, record: Monitor) => {
        const lastPing = record.lastPing;
        return (
          <div className="text-text">
            {lastPing ? (
              <div className="flex flex-col gap-1">
                <span className="text-white font-medium">
                  {formatLatency(lastPing.latency)}
                </span>
                {lastPing.statusCode && (
                  <span className="text-xs opacity-70">{lastPing.statusCode}</span>
                )}
              </div>
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
        );
      },
      sorter: (a, b) => {
        const aLatency = a.lastPing?.latency ?? 0;
        const bLatency = b.lastPing?.latency ?? 0;
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
      onFilter: (value, record) => {
        if (!record.lastPing) return false;
        const latencyStr = formatLatency(record.lastPing.latency);
        const statusCodeStr = record.lastPing.statusCode ? String(record.lastPing.statusCode) : "";
        return latencyStr.toLowerCase().includes(String(value).toLowerCase()) ||
               statusCodeStr.includes(String(value));
      },
    },
    {
      title: "Status",
      key: "status",
      render: (_, record: Monitor) => getStatusBadge(record),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search status (up/down/inactive)"
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
      onFilter: (value, record) => {
        let status = "";
        if (!record.isActive) {
          status = "inactive";
        } else if (!record.lastPing) {
          status = "no data";
        } else {
          status = record.lastPing.status;
        }
        return status.toLowerCase().includes(String(value).toLowerCase());
      },
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record: Monitor) => (
        <div className="flex justify-end gap-4">
          <Tooltip title="Edit">
            <Link
              href={`/dashboard/websites/edit?id=${record.id}`}
              className="text-white hover:text-white/80 transition-colors"
            >
              <FaEdit className="text-base" />
            </Link>
          </Tooltip>
          <Tooltip title="View Logs">
            <Link
              href={`/dashboard/websites/details?id=${record.id}`}
              className="text-white hover:text-white/80 transition-colors"
            >
              <FaList className="text-base" />
            </Link>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <CustomTable
      data={monitors}
      columns={columns}
      loading={loading}
      emptyMessage="No websites found"
      pageSize={10}
      enablePagination={true}
    />
  );
};

export default WebsitesTable;

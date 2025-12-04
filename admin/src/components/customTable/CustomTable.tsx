"use client";

import { Table } from "antd";
import type { ColumnType, TableProps } from "antd/es/table";

export type { ColumnType };

interface CustomTableProps<T> {
  data: T[];
  columns: ColumnType<T>[];
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  className?: string;
  enablePagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
}

function CustomTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  emptyMessage = "No data available",
  pageSize = 10,
  className = "",
  enablePagination = true,
  currentPage,
  _totalPages,
  total,
  onPageChange,
}: CustomTableProps<T>) {
  const tableProps: TableProps<T> = {
    dataSource: data,
    columns,
    loading,
    pagination: enablePagination
      ? {
          current: currentPage,
          pageSize,
          total: total,
          showSizeChanger: false, // Disable size changer for server-side pagination
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
          onChange: onPageChange ? (page) => onPageChange(page) : undefined,
        }
      : false,
    locale: {
      emptyText: emptyMessage,
    },
    className: className,
    rowKey: (record, index) => (record.id ?? index) as React.Key,
  };

  // When loading, return null to let the global loader handle it
  if (loading) {
    return null;
  }

  return (
    <div className={`card overflow-hidden p-0 ${className}`}>
      <div className="overflow-x-auto">
        <Table<T> {...tableProps} />
      </div>
    </div>
  );
}

export default CustomTable;

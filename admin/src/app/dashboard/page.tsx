"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useMemo } from "react";
import ButtonPrimary from "@/components/button/ButtonPrimary";
import { useLoader } from "@/contexts/LoaderContext";
import { FaSync } from "react-icons/fa";
import { HiOutlineGlobeAlt } from "react-icons/hi2";
import { TbClock, TbChartLine, TbAlertCircle, TbEye } from "react-icons/tb";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from "@tanstack/react-table";
import Link from "next/link";

const page = () => {
  const { setLoading } = useLoader();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    setLoading(!isLoaded);
  }, [isLoaded, setLoading]);

  const reloadPage = () => {
    window.location.reload();
  };

  const [data, setData] = useState({
    averageLatency: 245,
    averageUptime: 99.8,
    recentAlerts: 3,
    totalWebsites: 4,
    websitesAdditionLimit: 10,
  });

  // Mock website data - replace with API call later
  type Website = {
    id: string;
    websiteUrl: string;
    websiteName: string;
    monitoringStatus: "active" | "paused" | "inactive";
    lastStatus: "up" | "down" | "unknown";
    lastLatency: number;
    lastCheckDate: string;
  };

  const [websites, setWebsites] = useState<Website[]>([
    {
      id: "1",
      websiteUrl: "https://example.com",
      websiteName: "Example Site",
      monitoringStatus: "active",
      lastStatus: "up",
      lastLatency: 245,
      lastCheckDate: new Date().toISOString(),
    },
    {
      id: "2",
      websiteUrl: "https://test.com",
      websiteName: "Test Website",
      monitoringStatus: "active",
      lastStatus: "down",
      lastLatency: 0,
      lastCheckDate: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "3",
      websiteUrl: "https://demo.com",
      websiteName: "Demo Site",
      monitoringStatus: "paused",
      lastStatus: "unknown",
      lastLatency: 0,
      lastCheckDate: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "4",
      websiteUrl: "https://sample.org",
      websiteName: "Sample Organization",
      monitoringStatus: "active",
      lastStatus: "up",
      lastLatency: 189,
      lastCheckDate: new Date().toISOString(),
    },
  ]);

  const columnHelper = createColumnHelper<Website>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("websiteUrl", {
        header: "Website URL",
        cell: (info) => (
          <a
            href={info.getValue()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            {info.getValue()}
          </a>
        ),
      }),
      columnHelper.accessor("websiteName", {
        header: "Website Name",
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor("monitoringStatus", {
        header: "Monitoring Status",
        cell: (info) => {
          const status = info.getValue();
          const statusColors = {
            active: "text-success",
            paused: "text-warning",
            inactive: "text-error",
          };
          return (
            <span className={statusColors[status]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          );
        },
      }),
      columnHelper.accessor("lastStatus", {
        header: "Last Status",
        cell: (info) => {
          const status = info.getValue();
          const statusColors = {
            up: "text-success",
            down: "text-error",
            unknown: "text-warning",
          };
          return (
            <span className={statusColors[status]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          );
        },
      }),
      columnHelper.accessor("lastLatency", {
        header: "Last Latency",
        cell: (info) => {
          const latency = info.getValue();
          if (latency === 0) return <span className="opacity-50">-</span>;
          const colorClass =
            latency >= 1000
              ? "text-error"
              : latency >= 500
                ? "text-warning"
                : "text-success";
          return <span className={colorClass}>{latency}ms</span>;
        },
      }),
      columnHelper.accessor("lastCheckDate", {
        header: "Last Check Date",
        cell: (info) => {
          const date = new Date(info.getValue());
          return (
            <span className="text-xs!">
              {date.toLocaleDateString()} {date.toLocaleTimeString()}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => (
          <Link
            href={`/dashboard/websites/details?id=${info.row.original.id}`}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <TbEye />
            <span>View Details</span>
          </Link>
        ),
      }),
    ],
    [columnHelper],
  );

  const table = useReactTable({
    data: websites,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <>
      <div className="flex justify-between my-10 items-center border-b border-border pb-4">
        <h1 className="h2 ">
          {user?.username ||
            user?.firstName ||
            user?.emailAddresses[0]?.emailAddress}
          's Dashboard
        </h1>

        <ButtonPrimary name="Refresh" icon={<FaSync />} onclick={reloadPage} />
      </div>

      <div className="card flex flex-col gap-4 ">
        <div className="grid grid-cols-4 gap-4">
          <DashboardCard
            title="Total Websites"
            value={
              <span className="text-accent!">
                {data.totalWebsites.toString()}/
                {data.websitesAdditionLimit.toString()}
              </span>
            }
            icon={<HiOutlineGlobeAlt />}
          />
          <DashboardCard
            title="Average Latency"
            value={
              <span
                className={` ${data.averageLatency >= 1000 ? "text-error" : data.averageLatency >= 500 ? "text-warning" : "text-success"} flex flex-col`}
              >
                {data.averageLatency}ms
              </span>
            }
            icon={<TbClock />}
            dateRange="Last ping"
          />
          <DashboardCard
            title="Average Uptime"
            value={
              <span
                className={` ${data.averageUptime >= 99.5 ? "text-success" : data.averageUptime >= 99 ? "text-warning" : "text-error"} flex flex-col`}
              >
                {data.averageUptime}%
              </span>
            }
            icon={<TbChartLine />}
            dateRange="Last week"
          />
          <DashboardCard
            title="Recent Alerts"
            value={
              <span
                className={` ${data.recentAlerts >= 5 ? "text-error" : data.recentAlerts >= 1 ? "text-warning" : "text-success"} flex flex-col`}
              >
                {data.recentAlerts.toString()}
              </span>
            }
            icon={<TbAlertCircle />}
            dateRange="Last week"
          />
        </div>

        <p className="text-xs! text-center bg-white/10 p-2 rounded-md">
          {" "}
          Last updated on{" "}
          <span className="text-accent!">
            {new Date().toLocaleDateString()}
          </span>
        </p>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left p-4 text-sm font-semibold text-white"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center p-8 text-sm opacity-70"
                  >
                    No websites found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border hover:bg-gray/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4 text-sm">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <span className="text-xs! opacity-70">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>
          </div>
        )}
      </div>
    </>
  );
};

export default page;

function DashboardCard({
  title,
  value,
  icon,
  dateRange,
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  dateRange?: string;
}) {
  return (
    <div className="card-highlight flex items-center justify-between">
      <div className="flex items-start flex-col gap-2">
        <span className="text-2xl">{icon}</span>
        <p className="text-xs!">{title}</p>
        {dateRange && <p className="text-xs! opacity-70">{dateRange}</p>}
      </div>
      <p className="text-2xl! font-semibold!">{value}</p>
    </div>
  );
}

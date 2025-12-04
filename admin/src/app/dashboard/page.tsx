"use client";
import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import ButtonPrimary from "@/components/button/ButtonPrimary";
import { useLoader } from "@/contexts/LoaderContext";
import { useNotification } from "@/contexts/NotificationContext";
import { FaSync, FaCheckCircle, FaTimesCircle, FaClock, FaExternalLinkAlt } from "react-icons/fa";
import { HiOutlineGlobeAlt } from "react-icons/hi2";
import { TbClock, TbChartLine, TbAlertCircle } from "react-icons/tb";
import NoWebsiteCard from "@/components/noWebsiteCard/NoWebsiteCard";
import { getMonitors, Monitor, getMonitorLogs, MonitorLog } from "@/lib/api/monitors";
import { getAccountInfo, AccountInfoResponse, syncSubscription } from "@/lib/api/account";
import { ApiError } from "@/lib/api";

const page = () => {
  const { setLoading } = useLoader();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { showNotification } = useNotification();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [accountInfo, setAccountInfo] = useState<AccountInfoResponse | null>(null);
  const [recentLogs, setRecentLogs] = useState<MonitorLog[]>([]);
  const [uptimeLogs, setUptimeLogs] = useState<MonitorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    setLoading(!isLoaded);
  }, [isLoaded, setLoading]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setLoading(true);
        const token = await getToken();

        if (!token) {
          throw new Error("Authentication token not available");
        }

        const [monitorsResponse, accountResponse] = await Promise.all([
          getMonitors(token),
          getAccountInfo(token).catch((err) => {
            console.warn("Failed to fetch account info:", err);
            return null;
          }),
        ]);

        if (!isMounted) return;

        setMonitors(monitorsResponse.monitors);
        if (accountResponse) {
          console.log("Account Info from API:", accountResponse);
          console.log("Plan from API:", accountResponse.subscription.plan);
          console.log("Max Websites Limit:", accountResponse.limits.maxWebsites);
          setAccountInfo(accountResponse);
          
          // Check if Clerk metadata has a different plan and sync if needed
          const clerkPlan = user?.publicMetadata?.plan as string | undefined;
          if (clerkPlan && ["FREE", "PRO", "ENTERPRISE"].includes(clerkPlan)) {
            const clerkPlanTyped = clerkPlan as "FREE" | "PRO" | "ENTERPRISE";
            if (accountResponse.subscription.plan !== clerkPlanTyped) {
              console.log(`Plan mismatch detected: DB has ${accountResponse.subscription.plan}, Clerk has ${clerkPlanTyped}. Syncing...`);
              try {
                await syncSubscription(clerkPlanTyped, token);
                // Refetch account info after sync
                const updatedAccountResponse = await getAccountInfo(token).catch(() => null);
                if (updatedAccountResponse) {
                  setAccountInfo(updatedAccountResponse);
                  console.log("Subscription synced successfully. New plan:", updatedAccountResponse.subscription.plan);
                }
              } catch (syncErr) {
                console.error("Failed to sync subscription:", syncErr);
              }
            }
          }
        } else {
          console.warn("No account response received");
        }
        console.log("Clerk User:", user);
        console.log("Clerk Public Metadata:", user?.publicMetadata);

        // Fetch recent logs (last 24 hours) for all active monitors to calculate recent alerts
        const activeMonitors = monitorsResponse.monitors.filter((m) => m.isActive);
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
        const startDate = twentyFourHoursAgo.toISOString();

        try {
          // Fetch recent down logs from all active monitors in parallel
          const logPromises = activeMonitors.map((monitor) =>
            getMonitorLogs(
              monitor.id,
              {
                limit: 100, // Get up to 100 recent logs
                status: "down",
                startDate: startDate,
              },
              token
            ).catch((err) => {
              console.warn(`Failed to fetch logs for monitor ${monitor.id}:`, err);
              return { logs: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
            })
          );

          const logResponses = await Promise.all(logPromises);
          const allRecentLogs = logResponses.flatMap((response) => response.logs);
          setRecentLogs(allRecentLogs);
        } catch (err) {
          console.warn("Failed to fetch recent logs:", err);
          setRecentLogs([]);
        }

        // Fetch logs for uptime calculation (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const uptimeStartDate = sevenDaysAgo.toISOString();

        try {
          // Fetch all logs (up and down) from last 7 days for uptime calculation
          const uptimeLogPromises = activeMonitors.map((monitor) =>
            getMonitorLogs(
              monitor.id,
              {
                limit: 1000, // Get more logs for accurate uptime
                startDate: uptimeStartDate,
              },
              token
            ).catch((err) => {
              console.warn(`Failed to fetch uptime logs for monitor ${monitor.id}:`, err);
              return { logs: [], pagination: { page: 1, limit: 1000, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
            })
          );

          const uptimeLogResponses = await Promise.all(uptimeLogPromises);
          const allUptimeLogs = uptimeLogResponses.flatMap((response) => response.logs);
          setUptimeLogs(allUptimeLogs);
        } catch (err) {
          console.warn("Failed to fetch uptime logs:", err);
          setUptimeLogs([]);
        }

        setLastUpdated(new Date());
      } catch (err) {
        if (!isMounted) return;

        console.error("Failed to fetch dashboard data:", err);
        const apiError = err as ApiError;
        const errorMessage =
          apiError.error || apiError.detail || (err instanceof Error ? err.message : "Failed to fetch data");
        showNotification("Error", "error", errorMessage);
        setMonitors([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setLoading(false);
        }
      }
    };

    if (isLoaded) {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [isLoaded, getToken, showNotification, setLoading]);

  const reloadPage = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const [monitorsResponse, accountResponse] = await Promise.all([
        getMonitors(token),
        getAccountInfo(token).catch(() => null),
      ]);

      setMonitors(monitorsResponse.monitors);
      if (accountResponse) {
        console.log("Reload - Account Info:", accountResponse);
        console.log("Reload - Max Websites Limit:", accountResponse.limits.maxWebsites);
        setAccountInfo(accountResponse);
      }

      // Fetch recent logs (last 24 hours) for all active monitors
      const activeMonitors = monitorsResponse.monitors.filter((m) => m.isActive);
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      const startDate = twentyFourHoursAgo.toISOString();

      try {
        const logPromises = activeMonitors.map((monitor) =>
          getMonitorLogs(
            monitor.id,
            {
              limit: 100,
              status: "down",
              startDate: startDate,
            },
            token
          ).catch(() => ({ logs: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } }))
        );

        const logResponses = await Promise.all(logPromises);
        const allRecentLogs = logResponses.flatMap((response) => response.logs);
        setRecentLogs(allRecentLogs);
      } catch (err) {
        console.warn("Failed to fetch recent logs:", err);
        setRecentLogs([]);
      }

      // Fetch logs for uptime calculation (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const uptimeStartDate = sevenDaysAgo.toISOString();

      try {
        const uptimeLogPromises = activeMonitors.map((monitor) =>
          getMonitorLogs(
            monitor.id,
            {
              limit: 1000,
              startDate: uptimeStartDate,
            },
            token
          ).catch(() => ({ logs: [], pagination: { page: 1, limit: 1000, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } }))
        );

        const uptimeLogResponses = await Promise.all(uptimeLogPromises);
        const allUptimeLogs = uptimeLogResponses.flatMap((response) => response.logs);
        setUptimeLogs(allUptimeLogs);
      } catch (err) {
        console.warn("Failed to fetch uptime logs:", err);
        setUptimeLogs([]);
      }

      setLastUpdated(new Date());
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage =
        apiError.error || apiError.detail || "Failed to refresh data";
      showNotification("Error", "error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics from monitors
  const calculateStats = () => {
    const activeMonitors = monitors.filter((m) => m.isActive);
    const monitorsWithPings = activeMonitors.filter((m) => m.lastPing);

    // Calculate average latency
    const latencies = monitorsWithPings
      .map((m) => m.lastPing?.latency)
      .filter((latency): latency is number => latency !== null && latency !== undefined);
    const averageLatency = latencies.length > 0
      ? Math.round(latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length)
      : 0;

    // Count statuses
    const upCount = activeMonitors.filter(
      (m) => m.lastPing && m.lastPing.status === "up"
    ).length;
    const downCount = activeMonitors.filter(
      (m) => m.lastPing && m.lastPing.status === "down"
    ).length;
    const inactiveCount = monitors.filter((m) => !m.isActive).length;

    // Calculate uptime from history logs (last 7 days)
    // This gives a true uptime percentage based on actual ping history
    const totalPings = uptimeLogs.length;
    const upPings = uptimeLogs.filter((log) => log.status === "up").length;
    const averageUptime = totalPings > 0
      ? (upPings / totalPings) * 100
      : 100;

    // Count recent alerts from history logs (last 24 hours)
    // Count total number of down events (not just unique monitors)
    const recentAlerts = recentLogs.length;

    // Get the max websites limit from accountInfo, with proper fallback
    const maxWebsites = accountInfo?.limits.maxWebsites;
    const websitesAdditionLimit = maxWebsites !== undefined && maxWebsites !== null 
      ? maxWebsites 
      : monitors.length;

    // Debug logging
    if (accountInfo) {
      console.log("calculateStats - Account Info:", {
        plan: accountInfo.subscription.plan,
        maxWebsites: accountInfo.limits.maxWebsites,
        currentWebsites: accountInfo.limits.currentWebsites,
        calculatedLimit: websitesAdditionLimit,
      });
    }

    return {
      averageLatency,
      averageUptime: parseFloat(averageUptime.toFixed(2)),
      recentAlerts,
      upCount,
      downCount,
      inactiveCount,
      totalWebsites: monitors.length,
      websitesAdditionLimit,
    };
  };

  const stats = calculateStats();
  const recentMonitors = monitors.slice(0, 5);

  // Get plan with fallback to Clerk metadata
  const getPlanDisplay = () => {
    // First try from accountInfo (database)
    if (accountInfo?.subscription?.plan) {
      return accountInfo.subscription.plan;
    }
    // Fallback to Clerk public metadata
    const clerkPlan = user?.publicMetadata?.plan as string | undefined;
    if (clerkPlan && ["FREE", "PRO", "ENTERPRISE"].includes(clerkPlan)) {
      return clerkPlan as "FREE" | "PRO" | "ENTERPRISE";
    }
    // Default fallback
    return "FREE PLAN";
  };

  const planDisplay = getPlanDisplay();

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

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch {
      return url.length > 40 ? url.substring(0, 37) + "..." : url;
    }
  };

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

      {isLoading ? (
        <div className="card flex items-center justify-center p-8">
          <p className="text-text">Loading dashboard data...</p>
        </div>
      ) : stats.totalWebsites > 0 ? (
        <div className="flex flex-col gap-6">
          {/* Main Statistics Cards */}
          <div className="card flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-4">
              <DashboardCard
                title="Total Websites"
                value={
                  <span className="text-accent!">
                    {stats.totalWebsites.toString()}/
                    {stats.websitesAdditionLimit === null
                      ? "∞"
                      : stats.websitesAdditionLimit.toString()}
                  </span>
                }
                icon={<HiOutlineGlobeAlt />}
                dateRange={planDisplay}
                href="/dashboard/websites"
              />
              <DashboardCard
                title="Average Latency"
                value={
                  <span
                    className={` ${
                      stats.averageLatency >= 1000
                        ? "text-error"
                        : stats.averageLatency >= 500
                        ? "text-warning"
                        : "text-success"
                    } flex flex-col`}
                  >
                    {stats.averageLatency > 0 ? `${stats.averageLatency}ms` : "—"}
                  </span>
                }
                icon={<TbClock />}
                dateRange="this is the combined latency of all websites in the last 30 days "
                href="/dashboard/logs"
              />
              <DashboardCard
                title="Average Uptime"
                value={
                  <span
                    className={` ${
                      stats.averageUptime >= 99.5
                        ? "text-success"
                        : stats.averageUptime >= 99
                        ? "text-warning"
                        : "text-error"
                    } flex flex-col`}
                  >
                    {stats.averageUptime.toFixed(1)}%
                  </span>
                }
                icon={<TbChartLine />}

                dateRange="this is the combined Uptime of all websites in the last ping call "

                href="/dashboard/logs"
              />
              <DashboardCard
                title="Recent Alerts"
                value={
                  <span
                    className={` ${
                      stats.recentAlerts >= 5
                        ? "text-error"
                        : stats.recentAlerts >= 1
                        ? "text-warning"
                        : "text-success"
                    } flex flex-col`}
                  >
                    {stats.recentAlerts.toString()}
                  </span>
                }
                icon={<TbAlertCircle />}
                dateRange="Last 24 hours"
                href="/dashboard/alerts"
              />
            </div>

            <p className="text-xs! text-center bg-white/10 p-2 rounded-md shadow1">
              Last updated on{" "}
              <span className="text-accent!">
                {lastUpdated.toLocaleString()}
              </span>
            </p>
          </div>

          {/* Recent Websites Overview */}
          <div className="card flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Recent Websites</h2>
              <Link
                href="/dashboard/websites"
                className="text-accent hover:text-accent/80 text-sm transition-colors"
              >
                View All →
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {recentMonitors.length > 0 ? (
                recentMonitors.map((monitor) => (
                  <Link
                    key={monitor.id}
                    href={`/dashboard/websites/details?id=${monitor.id}`}
                    className="card-highlight p-4 hover:bg-background-secondary transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="shrink-0">{getStatusBadge(monitor)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">{monitor.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-text mt-1">
                          <span className="truncate">{formatUrl(monitor.url)}</span>
                          <a
                            href={monitor.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-accent hover:text-accent/80 shrink-0"
                          >
                            <FaExternalLinkAlt className="text-xs" />
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-text">
                      {monitor.lastPing ? (
                        <>
                          <span className="text-white font-medium">
                            {monitor.lastPing.latency !== null
                              ? `${monitor.lastPing.latency}ms`
                              : "—"}
                          </span>
                          {monitor.lastPing.statusCode && (
                            <span className="opacity-70">{monitor.lastPing.statusCode}</span>
                          )}
                        </>
                      ) : (
                        <span className="opacity-50">No data</span>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-text text-center py-4">No websites found</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <NoWebsiteCard />
      )}
    </>
  );
};

export default page;

function DashboardCard({
  title,
  value,
  icon,
  dateRange,
  href,
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  dateRange?: string;
  href?: string;
}) {
  const cardContent = (
    <div 
      className="card-highlight flex items-center justify-between"
      data-tooltip-id="my-tooltip"
      data-tooltip-content={dateRange || title}
      data-tooltip-place="top"
    >
      <div className="flex items-start flex-col gap-2">
        <span className="text-2xl">{icon}</span>
        <p className="text-xs!">{title}</p>
      </div>
      <p className="text-2xl! font-semibold!">{value}</p>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block transition-transform hover:scale-[1.02] cursor-pointer"
      >
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}


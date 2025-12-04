"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import ButtonPrimary from "@/components/button/ButtonPrimary";
import NoWebsiteCard from "@/components/noWebsiteCard/NoWebsiteCard";
import WebsitesTable from "@/components/websitesTable/WebsitesTable";
import { useLoader } from "@/contexts/LoaderContext";
import { useNotification } from "@/contexts/NotificationContext";
import type { ApiError } from "@/lib/api";
import { type AccountInfoResponse, getAccountInfo } from "@/lib/api/account";
import { getMonitors, type Monitor } from "@/lib/api/monitors";

const page = () => {
  const { getToken } = useAuth();
  const { showNotification } = useNotification();
  const { setLoading } = useLoader();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accountInfo, setAccountInfo] = useState<AccountInfoResponse | null>(
    null,
  );

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

        console.log("Fetching monitors and account info...");

        // Fetch monitors and account info in parallel
        const [monitorsResponse, accountResponse] = await Promise.all([
          getMonitors(token),
          getAccountInfo(token).catch((err) => {
            console.warn("Failed to fetch account info:", err);
            return null;
          }),
        ]);

        if (!isMounted) return;

        console.log("Monitors fetched:", monitorsResponse.monitors.length);
        setMonitors(monitorsResponse.monitors);
        if (accountResponse) {
          setAccountInfo(accountResponse);
        }
      } catch (err) {
        if (!isMounted) return;

        console.error("Failed to fetch monitors:", err);
        const apiError = err as ApiError;
        const errorMessage =
          apiError.error ||
          apiError.detail ||
          (err instanceof Error ? err.message : "Failed to fetch websites");
        showNotification("Error", "error", errorMessage);
        // Ensure monitors is set to empty array on error
        setMonitors([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [getToken, showNotification, setLoading]);

  // Use accountInfo count if available (more accurate), otherwise use monitors.length
  const currentCount = accountInfo?.limits.currentWebsites ?? monitors.length;
  const maxLimit = accountInfo?.limits.maxWebsites;
  const isUnlimited = maxLimit === null;
  const usagePercentage = maxLimit
    ? Math.min((currentCount / maxLimit) * 100, 100)
    : 0;

  return (
    <>
      <div className="flex justify-between my-10 items-center border-b border-border pb-4">
        <h1 className="h2">Websites</h1>
        <ButtonPrimary name="Add Website" link="/dashboard/websites/add" />
      </div>

      {/* Website Limit Banner */}
      {accountInfo && (
        <div className="mb-6 p-4 rounded-lg border border-border bg-background-secondary">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-text/60 text-sm">Website Usage</span>
                <span className="text-white font-semibold">
                  {currentCount}
                  {!isUnlimited && (
                    <span className="text-text/60 font-normal">
                      {" "}
                      / {maxLimit}
                    </span>
                  )}
                </span>
              </div>
              {!isUnlimited && (
                <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300 rounded-full"
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
              )}
            </div>
            {!isUnlimited && (
              <div className="text-right">
                <div className="text-text/60 text-xs mb-1">Plan Limit</div>
                <div className="text-white font-medium">{maxLimit}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {isLoading ? null : monitors.length === 0 ? (
        <div className="mt-8">
          <NoWebsiteCard />
        </div>
      ) : (
        <div className="mt-8">
          <WebsitesTable monitors={monitors} loading={false} />
        </div>
      )}
    </>
  );
};

export default page;

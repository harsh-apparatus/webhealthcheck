"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import ButtonPrimary from "@/components/button/ButtonPrimary";
import { useLoader } from "@/contexts/LoaderContext";
import { FaSync } from "react-icons/fa";
import { HiOutlineGlobeAlt } from "react-icons/hi2";
import { TbClock, TbChartLine, TbAlertCircle } from "react-icons/tb";
import NoWebsiteCard from "@/components/noWebsiteCard/NoWebsiteCard";

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
    recentAlerts: 0,
    totalWebsites: 4,
    websitesAdditionLimit: 10,

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

      {data?.totalWebsites && data.totalWebsites > 0 ? (
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
                  className={` ${
                    data.averageLatency >= 1000
                      ? "text-error"
                      : data.averageLatency >= 500
                      ? "text-warning"
                      : "text-success"
                  } flex flex-col`}
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
                  className={` ${
                    data.averageUptime >= 99.5
                      ? "text-success"
                      : data.averageUptime >= 99
                      ? "text-warning"
                      : "text-error"
                  } flex flex-col`}
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
                  className={` ${
                    data.recentAlerts >= 5
                      ? "text-error"
                      : data.recentAlerts >= 1
                      ? "text-warning"
                      : "text-success"
                  } flex flex-col`}
                >
                  {data.recentAlerts.toString()}
                </span>
              }
              icon={<TbAlertCircle />}
              dateRange="Last week"
            />
          </div>

          <p className="text-xs! text-center bg-white/10 p-2 rounded-md shadow1">
            {" "}
            Last updated on{" "}
            <span className="text-accent!">
              {new Date().toLocaleDateString()}
            </span>
          </p>
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

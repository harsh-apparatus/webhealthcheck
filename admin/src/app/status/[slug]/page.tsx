"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

interface MonitorData {
  id: number;
  name: string;
  url: string;
  isUp: boolean;
  lastPing: string | null;
  uptimePercentage: string;
  uptimeBarData: Array<{
    date: string;
    isUp: boolean | null;
    hasData: boolean;
  }>;
}

interface StatusPageData {
  id: number;
  name: string;
  slug: string;
  monitors: MonitorData[];
}

const PublicStatusPage = () => {
  const params = useParams();
  const slug = params.slug as string;
  const [statusPage, setStatusPage] = useState<StatusPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatusPage();
  }, [slug]);

  const fetchStatusPage = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
      const response = await fetch(`${backendUrl}/api/status-pages/public/${slug}`);

      if (!response.ok) {
        throw new Error("Status page not found");
      }

      const data = await response.json();
      setStatusPage(data.statusPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status page");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const getOverallStatus = () => {
    if (!statusPage || statusPage.monitors.length === 0) return null;
    return statusPage.monitors.every((m) => m.isUp);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-text">Loading...</div>
      </div>
    );
  }

  if (error || !statusPage) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-error">Status page not found</div>
      </div>
    );
  }

  const allServicesUp = getOverallStatus();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                allServicesUp ? "bg-success" : "bg-error"
              }`}
            >
              {allServicesUp ? (
                <FaCheckCircle className="text-black text-3xl" />
              ) : (
                <FaTimesCircle className="text-black text-3xl" />
              )}
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">
            {allServicesUp ? "All services are online" : "Some services are experiencing issues"}
          </h1>
          <p className="text-text/60">
            As of {formatDate(new Date().toISOString())}
          </p>
        </div>

        {/* Services List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-6">Primary Services</h2>

          {statusPage.monitors.map((monitor) => (
            <div key={monitor.id} className="bg-gray border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {monitor.isUp ? (
                    <FaCheckCircle className="text-success text-xl" />
                  ) : (
                    <FaTimesCircle className="text-error text-xl" />
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-white">{monitor.name}</h3>
                    <p className="text-text/60 text-sm">{monitor.url}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-success font-semibold text-lg">
                    Uptime {monitor.uptimePercentage}%
                  </p>
                </div>
              </div>

              {/* 30-day Uptime Bar */}
              <div className="mt-4">
                <div className="flex items-center gap-1 h-8">
                  {monitor.uptimeBarData.map((day, index) => {
                    let bgColor = "bg-border";
                    if (day.hasData) {
                      bgColor = day.isUp ? "bg-success" : "bg-error";
                    } else {
                      bgColor = "bg-border/50";
                    }

                    return (
                      <div
                        key={index}
                        className={`flex-1 h-full rounded ${bgColor} transition-colors`}
                        title={`${new Date(day.date).toLocaleDateString()}: ${
                          day.hasData ? (day.isUp ? "Up" : "Down") : "No data"
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-text/60">
                  <span>30 days ago</span>
                  <span>Today</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-text/60 text-sm">
          Powered by WebHealthCheck
        </div>
      </div>
    </div>
  );
};

export default PublicStatusPage;


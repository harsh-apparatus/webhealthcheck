"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { getWebworkerStatus, testWebworker, WebworkerStatusResponse } from "@/lib/api/webworker";
import { ApiError } from "@/lib/api";
import { useNotification } from "@/contexts/NotificationContext";
import { useLoader } from "@/contexts/LoaderContext";
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaSync, FaPlayCircle } from "react-icons/fa";

const page = () => {
  const { getToken } = useAuth();
  const { showNotification } = useNotification();
  const { setLoading } = useLoader();
  const [status, setStatus] = useState<WebworkerStatusResponse | null>(null);
  const [loading, setLocalLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async () => {
    try {
      setRefreshing(true);
      const token = await getToken();
      if (!token) {
        showNotification("Authentication Error", "error", "No authentication token available. Please sign in.");
        return;
      }

      const statusData = await getWebworkerStatus(token);
      setStatus(statusData);
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.error || apiError.detail || "Failed to fetch webworker status";
      showNotification("Error", "error", errorMessage);
      console.error("Failed to fetch webworker status:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [getToken, showNotification]);

  const handleTest = async () => {
    try {
      setTesting(true);
      setLoading(true);
      const token = await getToken();
      if (!token) {
        showNotification("Authentication Error", "error", "No authentication token available. Please sign in.");
        return;
      }

      const testResult = await testWebworker("https://www.google.com", true, token);
      
      if (testResult.success) {
        showNotification(
          "Test Successful",
          "success",
          `Webworker is working! Ping: ${testResult.result?.pingMs}ms, Status: ${testResult.result?.statusCode}`
        );
        // Refresh status after test
        await fetchStatus();
      } else {
        showNotification(
          "Test Failed",
          "error",
          testResult.error || testResult.detail || "Webworker test failed"
        );
      }
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.error || apiError.detail || "Failed to test webworker";
      showNotification("Error", "error", errorMessage);
      console.error("Failed to test webworker:", err);
    } finally {
      setTesting(false);
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!status) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm bg-gray border border-border">
          <FaSpinner className="animate-spin text-xs" />
          Checking...
        </span>
      );
    }

    if (status.status === "online") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm bg-success/20 border border-success/50 text-success">
          <FaCheckCircle className="text-xs" />
          Online
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm bg-error/20 border border-error/50 text-error">
        <FaTimesCircle className="text-xs" />
        Offline
      </span>
    );
  };

  return (
    <>
      <div className="flex justify-between my-10 items-center border-b border-border pb-4">
        <h1 className="h2">Settings</h1>
      </div>

      {/* Webworker Status Card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Webworker Service</h2>
            <p className="text-text/60 text-sm">
              Monitor and test the webworker service that handles URL pinging
            </p>
          </div>
          {getStatusBadge()}
        </div>

        {status && (
          <div className="mt-6 space-y-4">
            {/* Status Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-text/60 text-sm block mb-1">Service URL</label>
                <p className="text-white font-mono text-sm">{status.url}</p>
              </div>
              <div>
                <label className="text-text/60 text-sm block mb-1">Last Checked</label>
                <p className="text-white text-sm">
                  {new Date(status.lastChecked).toLocaleString()}
                </p>
              </div>
            </div>

            {status.status === "online" && status.response && (
              <div className="mt-4 p-4 bg-success/10 border border-success/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaCheckCircle className="text-success" />
                  <span className="text-success font-medium">Service is operational</span>
                </div>
                <div className="text-text/80 text-sm space-y-1">
                  <p>Service: {status.response.service}</p>
                  <p>Status: {status.response.status}</p>
                  <p>Time: {new Date(status.response.time).toLocaleString()}</p>
                </div>
              </div>
            )}

            {status.status === "offline" && status.error && (
              <div className="mt-4 p-4 bg-error/10 border border-error/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaTimesCircle className="text-error" />
                  <span className="text-error font-medium">Service is unavailable</span>
                </div>
                <p className="text-text/80 text-sm">{status.error}</p>
                <p className="text-text/60 text-xs mt-2">
                  Make sure the webworker service is running on port 4001
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-border">
              <button
                onClick={fetchStatus}
                disabled={refreshing}
                className="px-4 py-2 bg-background-secondary hover:bg-background-secondary/80 border border-border text-text rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FaSync className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Refreshing..." : "Refresh Status"}
              </button>
              <button
                onClick={handleTest}
                disabled={testing || status?.status === "offline"}
                className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {testing ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <FaPlayCircle />
                    Test Ping
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions Card */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-white mb-4">How to Start Webworker</h2>
        <div className="space-y-3 text-text/80">
          <div className="flex gap-3">
            <span className="text-accent font-bold">1.</span>
            <p>Navigate to the webworker directory:</p>
          </div>
          <div className="ml-8 p-3 bg-background-secondary rounded border border-border">
            <code className="text-sm text-white">cd webworker</code>
          </div>

          <div className="flex gap-3 mt-4">
            <span className="text-accent font-bold">2.</span>
            <p>Start the webworker service:</p>
          </div>
          <div className="ml-8 p-3 bg-background-secondary rounded border border-border">
            <code className="text-sm text-white">npm run dev</code>
          </div>

          <div className="flex gap-3 mt-4">
            <span className="text-accent font-bold">3.</span>
            <p>Verify it's running:</p>
          </div>
          <div className="ml-8 p-3 bg-background-secondary rounded border border-border">
            <code className="text-sm text-white">curl http://localhost:4001/health</code>
          </div>

          <div className="mt-4 p-4 bg-info/10 border border-info/30 rounded-lg">
            <p className="text-text/90 text-sm">
              <strong>Note:</strong> The webworker service must be running for monitor pings to work. 
              Cron jobs will fail if the webworker is offline.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default page;

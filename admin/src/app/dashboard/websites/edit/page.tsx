"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import ButtonPrimary from "@/components/button/ButtonPrimary";
import Toggle from "@/components/toggle/Toggle";
import { useLoader } from "@/contexts/LoaderContext";
import { useNotification } from "@/contexts/NotificationContext";
import type { ApiError } from "@/lib/api";
import { getMonitor, type Monitor, updateMonitor } from "@/lib/api/monitors";

const page = () => {
  const { getToken } = useAuth();
  const { showNotification } = useNotification();
  const { setLoading } = useLoader();
  const router = useRouter();
  const searchParams = useSearchParams();
  const monitorId = searchParams.get("id");

  const [formData, setFormData] = useState({
    name: "",
    url: "",
    isHttps: true,
  });
  const [loading, setLocalLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [monitor, setMonitor] = useState<Monitor | null>(null);

  // Fetch monitor data on mount
  useEffect(() => {
    const fetchMonitorData = async () => {
      if (!monitorId) {
        showNotification("Error", "error", "No monitor ID provided");
        router.push("/dashboard/websites");
        return;
      }

      setFetching(true);
      try {
        const token = await getToken();
        if (!token) {
          showNotification(
            "Authentication Error",
            "error",
            "No authentication token available. Please sign in.",
          );
          router.push("/dashboard/websites");
          return;
        }

        const data = await getMonitor(parseInt(monitorId, 10), token);
        setMonitor(data.monitor);
        setFormData({
          name: data.monitor.name,
          url: data.monitor.url,
          isHttps: data.monitor.isHttps,
        });
      } catch (err) {
        const apiError = err as ApiError;
        const errorMessage =
          apiError.error || apiError.detail || "Failed to load monitor data";
        showNotification("Failed to load monitor", "error", errorMessage);
        console.error("API Error:", err);
        router.push("/dashboard/websites");
      } finally {
        setFetching(false);
      }
    };

    fetchMonitorData();
  }, [monitorId, getToken, showNotification, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    setLoading(true);

    try {
      const token = await getToken();

      if (!token) {
        showNotification(
          "Authentication Error",
          "error",
          "No authentication token available. Please sign in.",
        );
        setLocalLoading(false);
        setLoading(false);
        return;
      }

      if (!monitorId) {
        showNotification("Error", "error", "No monitor ID provided");
        setLocalLoading(false);
        setLoading(false);
        return;
      }

      // Use the API service
      await updateMonitor(
        parseInt(monitorId, 10),
        {
          name: formData.name,
          url: formData.url,
          isHttps: formData.isHttps,
        },
        token,
      );

      showNotification(
        "Changes saved",
        "success",
        "Website monitor updated successfully!",
      );
      // Navigate back to websites list
      router.push("/dashboard/websites");
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage =
        apiError.error ||
        apiError.detail ||
        "An error occurred while updating the monitor";
      showNotification("Failed to update monitor", "error", errorMessage);
      console.error("API Error:", err);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-text">Loading monitor data...</div>
      </div>
    );
  }

  if (!monitor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-error">Monitor not found</div>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="flex justify-between my-10 items-center border-b border-border pb-4">
          <h1 className="h2">Edit Website</h1>

          <ButtonPrimary
            name="Back"
            icon={<FaArrowLeft />}
            link="/dashboard/websites"
          />
        </div>
      </div>

      <div className="card p-6">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 items-start"
        >
          <div className="flex flex-col gap-2 w-full">
            <label htmlFor="name">
              Website Name <span>*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., My Website"
              required
            />
          </div>

          <div className="flex flex-col gap-2 w-full">
            <label htmlFor="url">
              Website URL <span>*</span>
            </label>
            <input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => {
                const url = e.target.value;
                setFormData({
                  ...formData,
                  url,
                  isHttps: url.startsWith("https://"),
                });
              }}
              placeholder="https://example.com"
              required
            />
          </div>
          <Toggle
            isChecked={formData.isHttps}
            onChange={(checked) =>
              setFormData({ ...formData, isHttps: checked })
            }
            onText="HTTPS"
            offText="HTTP"
          />

          <ButtonPrimary
            name={loading ? "Saving..." : "Save Changes"}
            type="submit"
            disabled={loading}
            className="mt-4"
          />
        </form>
      </div>
    </>
  );
};

export default page;

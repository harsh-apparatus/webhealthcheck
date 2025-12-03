"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import ButtonPrimary from "@/components/button/ButtonPrimary";
import { FaArrowLeft } from "react-icons/fa";
import { createStatusPage } from "@/lib/api/statusPages";
import { getMonitors, Monitor } from "@/lib/api/monitors";
import { ApiError } from "@/lib/api";
import { useNotification } from "@/contexts/NotificationContext";
import { useLoader } from "@/contexts/LoaderContext";

const page = () => {
  const { getToken } = useAuth();
  const { showNotification } = useNotification();
  const { setLoading } = useLoader();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    monitorId: null as number | null,
  });

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLocalLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchMonitors();
  }, []);

  const fetchMonitors = async () => {
    try {
      setFetching(true);
      const token = await getToken();
      if (!token) return;

      const response = await getMonitors(token);
      setMonitors(response.monitors.filter((m) => m.isActive));
    } catch (err) {
      const apiError = err as ApiError;
      showNotification("Error", "error", "Failed to load monitors");
      console.error("API Error:", err);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    setLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        showNotification("Authentication Error", "error", "No authentication token available. Please sign in.");
        return;
      }

      if (!formData.name) {
        showNotification("Error", "error", "Name is required");
        return;
      }

      if (!formData.monitorId) {
        showNotification("Error", "error", "Please select a website to monitor");
        return;
      }

      // Generate slug from name
      const slug = generateSlug(formData.name);

      await createStatusPage(
        {
          name: formData.name,
          slug: slug,
          monitorIds: [formData.monitorId],
        },
        token
      );

      showNotification("Success", "success", "Status page created successfully!");
      router.push("/dashboard/status-pages");
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.detail || apiError.error || "Failed to create status page";
      showNotification("Failed to create", "error", errorMessage);
      console.error("API Error:", err);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };


  return (
    <>
      <div>
        <div className="flex justify-between my-10 items-center border-b border-border pb-4">
          <h1 className="h2">Create Status Page</h1>
          <ButtonPrimary
            name="Back"
            icon={<FaArrowLeft />}
            link="/dashboard/status-pages"
          />
        </div>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="name">
              Status Page Name <span className="text-error">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Production Services"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-text/60 text-sm">
              URL: <span className="text-text">/status/{formData.name ? generateSlug(formData.name) : "..."}</span>
            </label>
            <p className="text-text/60 text-xs">
              URL slug will be automatically generated from the status page name
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="monitor">
              Select Website to Display <span className="text-error">*</span>
            </label>
            {fetching ? (
              <p className="text-text/60">Loading monitors...</p>
            ) : monitors.length === 0 ? (
              <p className="text-text/60">No active monitors available</p>
            ) : (
              <select
                id="monitor"
                value={formData.monitorId || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    monitorId: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                required
                className="bg-background-secondary border border-border rounded px-3 py-2 text-text"
              >
                <option value="">Select a website...</option>
                {monitors.map((monitor) => (
                  <option key={monitor.id} value={monitor.id}>
                    {monitor.name} - {monitor.url}
                  </option>
                ))}
              </select>
            )}
          </div>

          <ButtonPrimary
            name={loading ? "Creating..." : "Create Status Page"}
            type="submit"
            disabled={loading || !formData.name || !formData.monitorId}
            className="mt-4"
          />
        </form>
      </div>
    </>
  );
};

export default page;


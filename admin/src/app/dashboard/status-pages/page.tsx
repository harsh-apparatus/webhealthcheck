"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import ButtonPrimary from "@/components/button/ButtonPrimary";
import { FaPlus, FaEdit, FaTrash, FaExternalLinkAlt } from "react-icons/fa";
import { getStatusPages, deleteStatusPage, StatusPage } from "@/lib/api/statusPages";
import { getMonitors } from "@/lib/api/monitors";
import { ApiError } from "@/lib/api";
import { useNotification } from "@/contexts/NotificationContext";
import { useLoader } from "@/contexts/LoaderContext";
import { useRouter } from "next/navigation";

const page = () => {
  const { getToken } = useAuth();
  const { showNotification } = useNotification();
  const { setLoading } = useLoader();
  const router = useRouter();
  const [statusPages, setStatusPages] = useState<StatusPage[]>([]);
  const [loading, setLocalLoading] = useState(false);

  useEffect(() => {
    fetchStatusPages();
  }, []);

  const fetchStatusPages = async () => {
    try {
      setLocalLoading(true);
      setLoading(true);
      const token = await getToken();
      const response = await getStatusPages(token);
      setStatusPages(response.statusPages);
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.error || apiError.detail || "Failed to fetch status pages";
      showNotification("Error", "error", errorMessage);
      console.error("Failed to fetch status pages:", err);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this status page?")) {
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      await deleteStatusPage(id, token);
      showNotification("Success", "success", "Status page deleted successfully");
      fetchStatusPages();
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.detail || apiError.error || "Failed to delete status page";
      showNotification("Failed to delete", "error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-between my-10 items-center border-b border-border pb-4">
        <h1 className="h2">Status Pages</h1>
        <ButtonPrimary
          name="Create Status Page"
          icon={<FaPlus />}
          onclick={() => router.push("/dashboard/status-pages/create")}
        />
      </div>

      {loading ? null : statusPages.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-text/60 mb-4">No status pages created yet.</p>
          <ButtonPrimary
            name="Create Your First Status Page"
            onclick={() => router.push("/dashboard/status-pages/create")}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {statusPages.map((statusPage) => (
            <div key={statusPage.id} className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {statusPage.name}
                  </h3>
                  <p className="text-text/60 text-sm">/{statusPage.slug}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    statusPage.isActive
                      ? "bg-success/20 border border-success/50 text-success"
                      : "bg-gray border border-border text-text"
                  }`}
                >
                  {statusPage.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-text/60 text-sm mb-2">
                  Monitors: {statusPage.monitors.length}
                </p>
                {statusPage.monitors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {statusPage.monitors.slice(0, 3).map((spm) => (
                      <span
                        key={spm.id}
                        className="px-2 py-1 rounded text-xs bg-background-secondary text-text"
                      >
                        {spm.monitor.name}
                      </span>
                    ))}
                    {statusPage.monitors.length > 3 && (
                      <span className="px-2 py-1 rounded text-xs bg-background-secondary text-text">
                        +{statusPage.monitors.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-border">
                <a
                  href={`/status/${statusPage.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-3 py-2 bg-background-secondary hover:bg-background-secondary/80 border border-border text-text rounded transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <FaExternalLinkAlt />
                  View
                </a>
                <button
                  onClick={() => router.push(`/dashboard/status-pages/edit?id=${statusPage.id}`)}
                  className="px-3 py-2 bg-background-secondary hover:bg-background-secondary/80 border border-border text-text rounded transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <FaEdit />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(statusPage.id)}
                  className="px-3 py-2 bg-error/20 hover:bg-error/30 border border-error/50 text-error rounded transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default page;


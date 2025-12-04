"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { getAccountInfo, AccountInfoResponse } from "@/lib/api/account";
import { ApiError } from "@/lib/api";
import { useNotification } from "@/contexts/NotificationContext";
import { FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import { HiOutlineSignal } from "react-icons/hi2";

const page = () => {
  const { getToken } = useAuth();
  const { showNotification } = useNotification();
  const [accountInfo, setAccountInfo] = useState<AccountInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccountInfo = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) {
          showNotification("Authentication Error", "error", "No authentication token available. Please sign in.");
          return;
        }

        const accountData = await getAccountInfo(token);
        setAccountInfo(accountData);
      } catch (err) {
        const apiError = err as ApiError;
        const errorMessage = apiError.error || apiError.detail || "Failed to fetch account information";
        showNotification("Error", "error", errorMessage);
        console.error("Failed to fetch account info:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountInfo();
  }, [getToken, showNotification]);

  const isProAccount = accountInfo?.subscription.plan === "PRO" || accountInfo?.subscription.plan === "ENTERPRISE";
  const hasStatusPageAccess = accountInfo?.limits.publicStatusPage || false;

  return (
    <>
      <div className="flex justify-between my-10 items-center border-b border-border pb-4">
        <h1 className="h2">Settings</h1>
      </div>

      {/* Status Page Card - Only show if PRO account */}
      {isProAccount && (
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-lg">
                <HiOutlineSignal className="text-accent text-xl" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Status Pages</h3>
                <p className="text-text/60 text-sm">Public status pages are enabled for your account</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasStatusPageAccess ? (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm bg-success/20 border border-success/50 text-success">
                  <FaCheckCircle className="text-xs" />
                  Enabled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm bg-gray border border-border text-text/60">
                  Disabled
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="card p-6 border border-error/30">
        <div className="flex items-center gap-2 mb-4">
          <FaExclamationTriangle className="text-error" />
          <h2 className="text-xl font-semibold text-white">Danger Zone</h2>
        </div>
        <p className="text-text/60 text-sm mb-6">
          Irreversible and destructive actions. Please proceed with caution.
        </p>
        
        <div className="space-y-4">
          {/* Add destructive actions here in the future */}
          <div className="p-4 bg-background-secondary rounded border border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium mb-1">Delete Account</h3>
                <p className="text-text/60 text-sm">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <button
                className="px-4 py-2 bg-error/20 hover:bg-error/30 border border-error/50 text-error rounded transition-colors"
                disabled
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default page;

"use client";

import { useNotification } from "@/contexts/NotificationContext";
import { FaCheckCircle, FaExclamationCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from "react-icons/fa";

const Notification = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  const getNotificationConfig = (type: string) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-gray",
          border: "border-success/40",
          gradientColor: "rgb(58, 255, 153)",
          iconColor: "text-success",
          icon: <FaCheckCircle className="text-success" />,
        };
      case "error":
        return {
          bg: "bg-gray",
          border: "border-error/40",
          gradientColor: "rgb(255, 114, 114)",
          iconColor: "text-error",
          icon: <FaExclamationCircle className="text-error" />,
        };
      case "warning":
        return {
          bg: "bg-gray",
          border: "border-warning/40",
          gradientColor: "rgb(255, 220, 62)",
          iconColor: "text-warning",
          icon: <FaExclamationTriangle className="text-warning" />,
        };
      case "info":
      default:
        return {
          bg: "bg-gray",
          border: "border-info/40",
          gradientColor: "rgb(58, 193, 255)",
          iconColor: "text-info",
          icon: <FaInfoCircle className="text-info" />,
        };
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md w-full px-4 md:px-0">
      {notifications.map((notification) => {
        const config = getNotificationConfig(notification.type);
        return (
          <div
            key={notification.id}
            className={`${config.border} border rounded-lg shadow-lg transition-all duration-300 overflow-hidden relative`}
            style={{
              animation: "slideInRight 0.3s ease-out",
            }}
          >
            {/* Background layer with bg-gray */}
            <div className="absolute inset-0 bg-gray -z-10"></div>
            
            {/* Gradient overlay */}
            <div
              className="absolute inset-0 -z-10"
              style={{
                background: `linear-gradient(to right, ${config.gradientColor}20 0%, ${config.gradientColor}20 30%, transparent 30%, transparent 100%)`,
              }}
            ></div>
            
            <div className="flex flex-row p-4 relative z-10">
              {/* Content Box */}
              <div className="flex flex-col flex-1 min-w-0 gap-2">
                {/* Top: Icon and Title */}
                <div className="flex items-center gap-3">
                  <div className="shrink-0 flex items-center">
                    {config.icon}
                  </div>
                  <h3 className="text-white text-sm font-medium leading-relaxed break-words">
                    {notification.title}
                  </h3>
                </div>
                
                {/* Bottom: Description */}
                {notification.description && (
                  <div className="pl-8">
                    <p className="text-white/70 text-xs font-medium leading-relaxed break-words">
                      {notification.description}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Close Button Box */}
              <div className="shrink-0 flex items-start pl-3">
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="text-white/70 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                  aria-label="Close notification"
                >
                  <FaTimes className="text-sm" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Notification;

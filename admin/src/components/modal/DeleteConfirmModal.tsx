"use client";

import { FaExclamationTriangle, FaTimes } from "react-icons/fa";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  isLoading?: boolean;
}

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  isLoading = false,
}: DeleteConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card p-6 max-w-md w-full mx-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text/60 hover:text-text transition-colors"
          disabled={isLoading}
        >
          <FaTimes />
        </button>

        {/* Icon and Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-error/20 flex items-center justify-center">
            <FaExclamationTriangle className="text-error text-xl" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
            <p className="text-text/80 text-sm">{message}</p>
            {itemName && (
              <p className="text-white font-medium mt-2 break-words">
                {itemName}
              </p>
            )}
          </div>
        </div>

        {/* Warning message */}
        <div className="bg-error/10 border border-error/30 rounded-md p-3 mb-6">
          <p className="text-error text-sm">
            This action cannot be undone. All associated data will be permanently deleted.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-background-secondary hover:bg-background-secondary/80 border border-border text-text rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-error/20 hover:bg-error/30 border border-error/50 text-error rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;


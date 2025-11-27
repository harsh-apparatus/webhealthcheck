"use client";
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";

interface HeaderProps {
  toggleSidebar: () => void;
  isCollapsed: boolean;
}

const Header = ({ toggleSidebar, isCollapsed }: HeaderProps) => {
  return (
    <div className="w-full h-16 bg-gray border-b border-border flex items-center p-4">
      <button
        onClick={toggleSidebar}
        className="p-2 text-white hover:bg-[rgb(40,40,40)] rounded transition-colors"
        aria-label="Toggle sidebar"
      >
        {isCollapsed ? (
  
          <GoSidebarCollapse className="w-5 h-5" />
        ) : (
            <GoSidebarExpand className="w-5 h-5" />

        )}
      </button>
    </div>
  );
};

export default Header;
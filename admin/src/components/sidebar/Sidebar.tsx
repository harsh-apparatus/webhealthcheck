"use client";
import {
  HiOutlineSquares2X2,
  HiOutlineGlobeAlt,
  HiOutlineDocumentText,
  HiOutlineCog,
} from "react-icons/hi2";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Upgrade from "../upgrade/Upgrade";

interface SidebarProps {
  isCollapsed: boolean;
}

const Sidebar = ({ isCollapsed }: SidebarProps) => {
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Dashboard",
      icon: HiOutlineSquares2X2,
      path: "/dashboard",
    },
    {
      name: "Websites",
      icon: HiOutlineGlobeAlt,
      path: "/dashboard/websites",
    },
    {
      name: "Logs",
      icon: HiOutlineDocumentText,
      path: "/dashboard/logs",
    },
    {
      name: "Settings",
      icon: HiOutlineCog,
      path: "/dashboard/settings",
    },
  ];

  return (
    <div
      className={`${isCollapsed ? "w-16" : "w-60"} h-[100%] bg-gray border-r border-border flex flex-col justify-between transition-all duration-300`}
    >
      <div
        className={`border-b border-border pb-4 h-16 ${isCollapsed ? "px-2" : "px-8"} py-4`}
      >
        <div className={`relative  p-4`}>
          {isCollapsed ? (
            <Image src="/logoWhite.svg" alt="Latenzo Console" fill />
          ) : (
            <Image src="/fullLogoWhite.svg" alt="Latenzo Console" fill />
          )}
        </div>
      </div>

      <div className="flex flex-col justify-between h-full">
        <nav
          className={`p-4 flex flex-col gap-2 ${isCollapsed ? "items-center" : ""}`}
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.path ||
                  pathname.startsWith(item.path + "/");

            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center rounded transition-colors ${
                  isCollapsed
                    ? "justify-center aspect-square p-0 w-12 h-12"
                    : "gap-3 px-3 py-2.5"
                } ${
                  isActive
                    ? "accent-grad text-white"
                    : "text-white hover:bg-[rgb(40,40,40)]"
                }`}
                title={isCollapsed ? item.name : undefined}
                {...(isCollapsed && {
                  "data-tooltip-id": "my-tooltip",
                  "data-tooltip-place": "right",
                  "data-tooltip-content": item.name,
                  "data-tooltip-variant": "light",
                  "data-tooltip-arrow": true,
                  "data-tooltip-arrow-color": "var(--gray)",
                  "data-tooltip-arrow-size": 10,
                  "data-tooltip-arrow-offset": 10,
                  "data-tooltip-arrow-offset-x": 10,
                  "data-tooltip-arrow-offset-y": 10,
                })}
              >
                <Icon className={`${isCollapsed ? "w-6 h-6" : "w-6 h-6"}`} />
                {!isCollapsed && (
                  <span className="text-sm font-normal">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>
        {!isCollapsed && <Upgrade />}
      </div>

      {!isCollapsed && (
        <div className="border-t border-border pb-4 px-8 py-4">
          <p className="text-xs! opacity-50 text-center">Version 1.0.0</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

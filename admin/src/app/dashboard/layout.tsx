"use client";
import { useState } from "react";
import Header from "@/components/header/Header";
import Sidebar from "@/components/sidebar/Sidebar";
import Loader from "@/components/loader/Loader";
import { LoaderProvider, useLoader } from "@/contexts/LoaderContext";
import "react-tooltip/dist/react-tooltip.css";
import { Tooltip as ReactTooltip } from "react-tooltip";

function DashboardContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isLoading } = useLoader();

  return (
    <>
      <ReactTooltip id="my-tooltip" />
      <Loader isLoading={isLoading} />
      <div className="flex h-[calc(100vh-64px)]">
        <Sidebar isCollapsed={isCollapsed} />
        <div className="flex flex-col w-full ">
          <Header
            toggleSidebar={() => setIsCollapsed(!isCollapsed)}
            isCollapsed={isCollapsed}
          />
          <div className="parent h-[calc(100%-64px)] overflow-y-auto">
            <div className="container">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased h-screen w-screen overflow-hidden`}>
        <LoaderProvider>
          <DashboardContent>{children}</DashboardContent>
        </LoaderProvider>
      </body>
    </html>
  );
}

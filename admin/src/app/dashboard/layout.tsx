"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Header from "@/components/header/Header";
import Sidebar from "@/components/sidebar/Sidebar";
import Loader from "@/components/loader/Loader";
import Notification from "@/components/notification/Notification";
import { LoaderProvider, useLoader } from "@/contexts/LoaderContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import "react-tooltip/dist/react-tooltip.css";
import { Tooltip as ReactTooltip } from "react-tooltip";

function DashboardContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isLoading } = useLoader();
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <>
      <ReactTooltip id="my-tooltip" />
      <Loader isLoading={isLoading} />
      <Notification />
      <div className="flex h-[calc(100vh)]">
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
          <NotificationProvider>
            <DashboardContent>{children}</DashboardContent>
          </NotificationProvider>
        </LoaderProvider>
      </body>
    </html>
  );
}

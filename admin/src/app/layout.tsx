import type { Metadata } from "next";
import "./globals.css";
import "antd/dist/reset.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ConfigProvider } from "antd";

export const metadata: Metadata = {
  title: "Latenzo Console",
  description: "Real-Time Uptime. Real-World Confidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased h-screen w-screen overflow-hidden`}>
        <ConfigProvider
          theme={{
            token: {
              colorBgContainer: "rgb(30, 30, 30)",
              colorBgElevated: "rgb(30, 30, 30)",
              colorBorder: "rgb(63, 63, 63)",
              colorText: "rgb(222, 222, 222)",
              colorTextHeading: "rgb(255, 255, 255)",
              colorFillSecondary: "rgba(30, 30, 30, 0.2)",
              borderRadius: 4,
            },
            components: {
              Table: {
                headerBg: "rgba(30, 30, 30, 0.3)",
                headerColor: "rgb(255, 255, 255)",
                borderColor: "rgb(63, 63, 63)",
                rowHoverBg: "rgba(30, 30, 30, 0.2)",
                headerSortActiveBg: "rgba(30, 30, 30, 0.3)",
                headerSortHoverBg: "rgba(30, 30, 30, 0.2)",
                filterDropdownBg: "rgb(30, 30, 30)",
                headerFilterHoverBg: "rgba(30, 30, 30, 0.2)",
              },
              Input: {
                colorBgContainer: "rgb(30, 30, 30)",
                colorBorder: "rgb(63, 63, 63)",
                colorText: "rgb(222, 222, 222)",
                colorTextPlaceholder: "rgba(222, 222, 222, 0.5)",
              },
              Pagination: {
                colorBgContainer: "rgb(30, 30, 30)",
                colorBorder: "rgb(63, 63, 63)",
                colorText: "rgb(222, 222, 222)",
              },
            },
          }}
        >
          <ClerkProvider>{children}</ClerkProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}

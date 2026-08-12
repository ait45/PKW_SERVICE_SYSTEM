// ตรวจสอบ Provider
import { AuthProvider } from "./AuthProvider";
import type { ReactNode } from "react";

// font system
import "./globals.css";
import localFont from "next/font/local";

const MyFontWeb = localFont({
  src: [
    {
      path: "./assets/fonts/SF-Thonburi-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./assets/fonts/SF-Thonburi-semibold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
});

// Progress Action
import ProgressBar from "./ProgressBar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PKW Service System",
  description: "Prakeawasawittaya School",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${MyFontWeb.className} antialiased`}>
        <AuthProvider>
          <ProgressBar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

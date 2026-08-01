import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import AdminShell from "@/layout/AdminShell";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HMS Hotel",
  description: "Hotel Property Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} min-h-screen w-full overflow-x-hidden dark:bg-gray-900`}>
        <ThemeProvider>
          <SidebarProvider>
            <AdminShell>{children}</AdminShell>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

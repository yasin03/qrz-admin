import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReactQueryProvider from "@/providers/react-query-provider";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeProvider } from "@/providers/theme-provider";
import { cookies } from "next/headers";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QR Zaman Admin Panel",
  description: "QR Zaman Admin Yönetim Paneli",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultSidebarOpen =
    cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <ReactQueryProvider>
              <AppShell defaultSidebarOpen={defaultSidebarOpen}>
                {children}
              </AppShell>
              <Toaster richColors position="top-right" />
            </ReactQueryProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import ClientProviders from "@/providers/ClientProviders";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClientFlow - All-in-One Client Management for Agencies",
  description:
    "ClientFlow is the ultimate platform for agencies to manage clients, projects, and billing in one place. Streamline your workflow and grow your business with ease.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased scrollbar-thin`}
      >
        <NextTopLoader
          color="#ffffff33"
          initialPosition={0.08}
          crawlSpeed={200}
          height={4}
          crawl={true}
          showSpinner={false}
          easing="ease-in-out"
          speed={200}
        />
        <NuqsAdapter>
          <ClientProviders>{children}</ClientProviders>
        </NuqsAdapter>
      </body>
    </html>
  );
}

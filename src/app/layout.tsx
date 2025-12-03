import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Craft Sync - Sync Google Calendar to Craft Notes",
    template: "%s | Craft Sync",
  },
  description:
    "Automatically sync your Google Calendar events to Craft daily notes. Real-time synchronization, smart organization, and seamless integration. Never miss a meeting again.",
  keywords: [
    "Craft",
    "Craft Notes",
    "Google Calendar",
    "Calendar Sync",
    "Daily Notes",
    "Productivity",
    "Note-taking",
    "Calendar Integration",
    "Task Management",
    "Time Management",
  ],
  authors: [{ name: "Craft Sync" }],
  creator: "Craft Sync",
  publisher: "Craft Sync",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Craft Sync - Sync Google Calendar to Craft Notes",
    description:
      "Automatically sync your Google Calendar events to Craft daily notes. Real-time synchronization for perfect productivity.",
    siteName: "Craft Sync",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Craft Sync - Calendar to Notes Integration",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Craft Sync - Sync Google Calendar to Craft Notes",
    description:
      "Automatically sync your Google Calendar events to Craft daily notes. Real-time synchronization for perfect productivity.",
    images: ["/og-image.png"],
    creator: "@craftsynс",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.json",
  category: "productivity",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Craft Sync",
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
  verification: {
    google: "your-google-site-verification-code",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6366f1" },
    { media: "(prefers-color-scheme: dark)", color: "#4f46e5" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to important domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://accounts.google.com" />

        {/* DNS prefetch for faster loading */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        {/* Additional meta tags for better browser support */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Craft Sync" />

        {/* Microsoft specific */}
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

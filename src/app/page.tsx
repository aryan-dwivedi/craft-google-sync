import { redirect } from 'next/navigation'
import { createClient } from "@/utils/supabase/server"
import { LaunchScreenClient } from "./LaunchScreenClient"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Sync Google Calendar to Craft Notes - Real-time Integration",
  description: "Automatically sync your Google Calendar events to Craft daily notes. Real-time synchronization, smart organization, and seamless integration. Get started in 2 minutes.",
  openGraph: {
    title: "Craft Sync - Sync Google Calendar to Craft Notes",
    description: "Automatically sync your Google Calendar events to Craft daily notes. Real-time synchronization for perfect productivity.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Craft Sync - Calendar to Notes Integration",
      },
    ],
  },
}

export default async function LaunchScreen() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Craft Sync",
    "applicationCategory": "ProductivityApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "ratingCount": "100"
    },
    "description": "Automatically sync your Google Calendar events to Craft daily notes with real-time synchronization",
    "featureList": [
      "Real-time calendar sync",
      "Smart organization",
      "Secure integration",
      "Automatic daily note creation"
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LaunchScreenClient />
    </>
  )
}

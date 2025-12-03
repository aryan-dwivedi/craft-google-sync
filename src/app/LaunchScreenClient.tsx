"use client"

import { Button } from "@/components/ui/button"
import { Calendar, Zap, Shield, Sparkles, ArrowRight, Check } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useState } from "react"

export function LaunchScreenClient() {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }

  return (
    <div className="min-h-screen w-full bg-white overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-white" />

        {/* Floating orbs for depth */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-32">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-semibold text-gray-900">Craft Sync</span>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="text-center max-w-5xl mx-auto space-y-12">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">Seamless Calendar Integration</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-7xl md:text-8xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Your calendar.
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Your notes.
              </span>
              <br />
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                In perfect sync.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
              Automatically sync your Google Calendar events to Craft. Never miss a meeting, never lose track of your schedule.
            </p>

            {/* CTA Button */}
            <div className="pt-8 flex flex-col items-center space-y-4">
              <Button
                onClick={handleLogin}
                disabled={isLoading}
                className="h-16 px-12 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl shadow-2xl shadow-indigo-500/30 transition-all hover:scale-105 hover:shadow-indigo-500/40"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Get Started
                    <ArrowRight className="ml-3 w-5 h-5" />
                  </>
                )}
              </Button>
              <p className="text-sm text-gray-500">Free to use. No credit card required.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative bg-gray-50 py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Built for productivity
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to stay organized
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group">
              <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 h-full border border-gray-100 hover:border-indigo-200">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Real-time Sync
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Events sync automatically to your Craft daily notes. Updates happen instantly, keeping everything current.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group">
              <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 h-full border border-gray-100 hover:border-purple-200">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Smart Organization
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Events automatically go to the correct daily note. Time-based organization you can rely on.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group">
              <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 h-full border border-gray-100 hover:border-pink-200">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Secure & Private
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Your data is encrypted and secure. We never modify or delete your calendar events.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="relative py-32 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Simple setup
            </h2>
            <p className="text-xl text-gray-600">
              Get started in three easy steps
            </p>
          </div>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex items-start space-x-6 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                1
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Connect your accounts
                </h3>
                <p className="text-lg text-gray-600">
                  Sign in with Google and connect your Craft workspace. Takes less than a minute.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-6 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                2
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Choose your calendars
                </h3>
                <p className="text-lg text-gray-600">
                  Select which calendars you want to sync. Personal, work, or both—your choice.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-6 group">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                3
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Done! Everything syncs automatically
                </h3>
                <p className="text-lg text-gray-600">
                  Your events appear in Craft instantly. Updates happen in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Ready to sync?
          </h2>
          <p className="text-2xl text-indigo-100 mb-12">
            Start organizing your life in seconds
          </p>
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="h-16 px-12 text-lg font-semibold bg-white text-indigo-600 hover:bg-gray-50 rounded-2xl shadow-2xl transition-all hover:scale-105"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mr-3" />
                Connecting...
              </>
            ) : (
              <>
                Get Started for Free
                <ArrowRight className="ml-3 w-5 h-5" />
              </>
            )}
          </Button>
          <p className="text-indigo-100 mt-6">
            <Check className="w-4 h-4 inline mr-2" />
            No credit card required
            <span className="mx-3">•</span>
            <Check className="w-4 h-4 inline mr-2" />
            2 minute setup
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between text-gray-600 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Craft Sync</span>
            </div>
            <div className="space-x-6">
              <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings as SettingsIcon, Eye, EyeOff, Save, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { saveUserSettings, validateCraftToken } from '@/app/actions/settings'

interface SettingsClientProps {
  initialSettings: {
    craft_api_url: string
    craft_api_token: string | null
  } | null
  userEmail?: string
}

export function SettingsClient({ initialSettings, userEmail }: SettingsClientProps) {
  const [url, setUrl] = useState(initialSettings?.craft_api_url || '')
  const [token, setToken] = useState(initialSettings?.craft_api_token || '')
  const [showToken, setShowToken] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleValidate = async () => {
    setValidating(true)
    setValidationStatus('idle')

    const isValid = await validateCraftToken(url, token)

    setValidating(false)
    setValidationStatus(isValid ? 'success' : 'error')
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus('idle')

    try {
      await saveUserSettings({
        craft_api_url: url,
        craft_api_token: token,
      })
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5" />
            <span>Craft API Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="api-url">API URL</Label>
            <Input
              id="api-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://connect.craft.do/links/YOUR_CONNECTION_ID/api/v1"
              className="h-12"
            />
            <p className="text-sm text-gray-500">
              Your Craft API connection URL
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-token">API Token</Label>
            <div className="relative">
              <Input
                id="api-token"
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your Craft API token"
                className="h-12 pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-12 px-3"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? (
                  <EyeOff className="w-4 h-4 text-gray-500" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-500" />
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Get your token from{' '}
              <a
                href="https://www.craft.do/s/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3c2cd4] hover:underline"
              >
                Craft API Settings →
              </a>
            </p>
          </div>

          {validationStatus !== 'idle' && (
            <div className={`flex items-start space-x-2 p-4 rounded-lg ${
              validationStatus === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {validationStatus === 'success' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Connection successful!</p>
                    <p className="text-sm mt-1">Your Craft API credentials are valid.</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Connection failed</p>
                    <p className="text-sm mt-1">Please verify your API URL and token are correct.</p>
                  </div>
                </>
              )}
            </div>
          )}

          {saveStatus === 'success' && (
            <div className="flex items-start space-x-2 p-4 rounded-lg bg-green-50 text-green-700">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Settings saved!</p>
                <p className="text-sm mt-1">Your configuration has been updated.</p>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              onClick={handleValidate}
              disabled={!url || !token || validating}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              {validating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>

            <Button
              onClick={handleSave}
              disabled={!url || !token || saving}
              size="lg"
              className="flex-1 bg-gradient-to-r from-[#3c2cd4] to-[#5b4de8] hover:from-[#2f23a8] hover:to-[#4a3ec7] text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <p className="text-gray-900 mt-1">{userEmail}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

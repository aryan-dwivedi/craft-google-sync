'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveUserSettings, validateCraftToken } from '@/app/actions/settings'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface CraftConfigStepProps {
  onNext: () => void
  onBack: () => void
  craftConfig: { url: string; token: string }
  setCraftConfig: (config: { url: string; token: string }) => void
}

export function CraftConfigStep({ onNext, onBack, craftConfig, setCraftConfig }: CraftConfigStepProps) {
  const [url, setUrl] = useState(craftConfig.url || 'https://connect.craft.do/links/91anr3mDrIB/api/v1')
  const [token, setToken] = useState(craftConfig.token || '')
  const [validating, setValidating] = useState(false)
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleValidate = async () => {
    setValidating(true)
    setValidationStatus('idle')

    const isValid = await validateCraftToken(url, token)
    
    setValidating(false)
    setValidationStatus(isValid ? 'success' : 'error')

    if (isValid) {
      setCraftConfig({ url, token })
      await saveUserSettings({ craft_api_url: url, craft_api_token: token })
    }
  }

  const handleNext = () => {
    if (validationStatus === 'success') {
      onNext()
    }
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Configure Craft API</h2>
        <p className="text-gray-600">
          Enter your Craft API credentials to enable syncing
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="craft-url">Craft API URL</Label>
          <Input
            id="craft-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://connect.craft.do/links/YOUR_CONNECTION_ID/api/v1"
            className="h-12"
          />
          <p className="text-sm text-gray-500">
            Example: <code className="bg-gray-100 px-1 rounded">https://connect.craft.do/links/91anr3mDrIB/api/v1</code>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="craft-token">API Token</Label>
          <Input
            id="craft-token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter your Craft API token"
            className="h-12"
          />
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
                  <p className="text-sm mt-1">
                    Please verify:
                  </p>
                  <ul className="text-sm mt-1 list-disc list-inside space-y-1">
                    <li>Your API URL is correct (check the connection ID)</li>
                    <li>Your API token is valid and not expired</li>
                    <li>You have the necessary permissions</li>
                  </ul>
                  <p className="text-sm mt-2">
                    Check the browser console for detailed error messages.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-6">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
          className="border-2 hover:bg-gray-50"
        >
          Back
        </Button>

        <div className="flex space-x-3">
          <Button
            onClick={handleValidate}
            disabled={!url || !token || validating}
            variant="outline"
            size="lg"
            className="border-2 hover:bg-gray-50"
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
            onClick={handleNext}
            disabled={validationStatus !== 'success'}
            size="lg"
            className="bg-gradient-to-r from-[#3c2cd4] to-[#5b4de8] hover:from-[#2f23a8] hover:to-[#4a3ec7] text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}

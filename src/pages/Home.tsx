import { Link } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { healthCheck } from '../api/client'
import { useState, useEffect } from 'react'
import { useToast } from '../hooks/useToast'

export const Home = () => {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking')
  const [message, setMessage] = useState('')
  const toast = useToast()

  useEffect(() => {
    healthCheck()
      .then(data => {
        setStatus('ok')
        setMessage(`Service: ${data.service || 'HOLIDAY'}, Status: ${data.status || 'healthy'}`)
        toast.showSuccess('Successfully connected to HOLIDAY API')
      })
      .catch(error => {
        setStatus('error')
        setMessage(
          error.response?.data?.error?.message || error.message || 'Could not connect to API server'
        )
        toast.showError('Failed to connect to HOLIDAY API')
      })
  }, [toast])

  const handleRetry = () => {
    setStatus('checking')
    setMessage('')
    healthCheck()
      .then(data => {
        setStatus('ok')
        setMessage(`Service: ${data.service || 'HOLIDAY'}, Status: ${data.status || 'healthy'}`)
        toast.showSuccess('Successfully connected to HOLIDAY API')
      })
      .catch(error => {
        setStatus('error')
        setMessage(
          error.response?.data?.error?.message || error.message || 'Could not connect to API server'
        )
        toast.showError('Failed to connect to HOLIDAY API')
      })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to HOLIDAY Web Client
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Create, edit, and visualize CTXDSL specifications
        </p>
      </div>

      <div
        className="bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-cyan-900/20 rounded-xl shadow-md border border-blue-200/50 dark:border-blue-800/50 p-6 mb-6"
        data-tutorial="connection-status"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          API Connection Status
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <strong>API URL:</strong>{' '}
              {import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'}
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  status === 'checking'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    : status === 'ok'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}
              >
                {status === 'checking' && '🔄 Checking...'}
                {status === 'ok' && '✅ Connected'}
                {status === 'error' && '❌ Error'}
              </span>
            </div>
          </div>
          {message && (
            <div
              className={`p-3 rounded-md ${
                status === 'ok'
                  ? 'bg-green-50 border border-green-200 dark:bg-green-900/10 dark:border-green-800'
                  : 'bg-red-50 border border-red-200 dark:bg-red-900/10 dark:border-red-800'
              }`}
            >
              <p
                className={`text-sm ${status === 'ok' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}
              >
                {message}
              </p>
            </div>
          )}
          {status === 'error' && (
            <Button onClick={handleRetry} variant="primary">
              Retry Connection
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-800 dark:to-purple-900/20 rounded-xl shadow-md border border-purple-200/50 dark:border-purple-800/50 p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            📝 Editors
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Create and edit CTXDSL specifications
          </p>
          <div className="space-y-2">
            <Link to="/editor/ctxdsl">
              <Button variant="secondary" className="w-full">
                CTXDSL Editor
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-teal-50/50 dark:from-gray-800 dark:to-teal-900/20 rounded-xl shadow-md border border-teal-200/50 dark:border-teal-800/50 p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            📊 Visualizations
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            View summaries and graph representations
          </p>
          <div className="space-y-2">
            <Link to="/visualization/summary">
              <Button variant="secondary" className="w-full">
                Summary View
              </Button>
            </Link>
            <Link to="/visualization/graphs">
              <Button variant="secondary" className="w-full">
                Graph View
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-orange-50/50 dark:from-gray-800 dark:to-orange-900/20 rounded-xl shadow-md border border-orange-200/50 dark:border-orange-800/50 p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            🔄 Workflows
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Synthesize controllers
          </p>
          <div className="space-y-2">
            <Link to="/workflows/synthesis">
              <Button variant="secondary" className="w-full">
                Synthesis
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

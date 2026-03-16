/**
 * Analytics Viewer Component
 * Displays analytics data in development mode
 */

import { useState, useEffect } from 'react'
import { useAnalytics } from '../../hooks/useAnalytics'
import { Button } from './Button'
import './AnalyticsViewer.css'

export const AnalyticsViewer = () => {
  const { getSummary, exportData } = useAnalytics()
  const [summary, setSummary] = useState(getSummary())
  const [isOpen, setIsOpen] = useState(false)

  // Update summary periodically
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setSummary(getSummary())
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, getSummary])

  // Only show in development
  if (import.meta.env.PROD) {
    return null
  }

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isOpen) {
    return (
      <button
        className="analytics-viewer-toggle"
        onClick={() => setIsOpen(true)}
        title="Open Analytics Viewer"
      >
        📊
      </button>
    )
  }

  return (
    <div className="analytics-viewer">
      <div className="analytics-viewer-header">
        <h3>Analytics Dashboard</h3>
        <div className="analytics-viewer-actions">
          <Button variant="ghost" size="sm" onClick={handleExport}>
            Export
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </div>

      <div className="analytics-viewer-content">
        <div className="analytics-section">
          <h4>API Calls</h4>
          <div className="analytics-stats">
            <div className="analytics-stat">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{summary.totalApiCalls}</span>
            </div>
            <div className="analytics-stat">
              <span className="stat-label">Success:</span>
              <span className="stat-value success">{summary.successfulApiCalls}</span>
            </div>
            <div className="analytics-stat">
              <span className="stat-label">Failed:</span>
              <span className="stat-value error">{summary.failedApiCalls}</span>
            </div>
            <div className="analytics-stat">
              <span className="stat-label">Avg Duration:</span>
              <span className="stat-value">{summary.averageApiCallDuration.toFixed(2)}ms</span>
            </div>
          </div>
        </div>

        <div className="analytics-section">
          <h4>Errors & Warnings</h4>
          <div className="analytics-stats">
            <div className="analytics-stat">
              <span className="stat-label">Errors:</span>
              <span className="stat-value error">{summary.totalErrors}</span>
            </div>
            <div className="analytics-stat">
              <span className="stat-label">Warnings:</span>
              <span className="stat-value warning">{summary.totalWarnings}</span>
            </div>
          </div>
        </div>

        <div className="analytics-section">
          <h4>User Actions</h4>
          <div className="analytics-stats">
            <div className="analytics-stat">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{summary.totalUserActions}</span>
            </div>
          </div>
        </div>

        {summary.slowOperations.length > 0 && (
          <div className="analytics-section">
            <h4>Slow Operations</h4>
            <div className="analytics-list">
              {summary.slowOperations.map((op, idx) => (
                <div key={idx} className="analytics-item">
                  <span className="item-name">{op.name}</span>
                  <span className="item-value">{op.duration.toFixed(2)}ms</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.recentErrors.length > 0 && (
          <div className="analytics-section">
            <h4>Recent Errors</h4>
            <div className="analytics-list">
              {summary.recentErrors.slice(-5).map((error, idx) => (
                <div key={idx} className="analytics-item error">
                  <span className="item-name">{error.source}</span>
                  <span className="item-value">{error.message.substring(0, 50)}...</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

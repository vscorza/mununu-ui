import { useState } from 'react'
import { useVerification } from '../../hooks/useVerification'
import { VerificationResults } from '../verification/VerificationResults'
import { BusinessResults } from '../verification/BusinessResults'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { Tabs } from '../common/Tabs'
import { useToast } from '../../hooks/useToast'
import type { VerificationType } from '../../hooks/useVerification'
import type { paths } from '../../api/types'
import './VerificationWorkflow.css'

type VerificationRequestType =
  paths['/api/v1/bpm/verify/structural']['post']['requestBody']['content']['application/json']
type BusinessVerificationRequestType =
  paths['/api/v1/bpm/verify/business']['post']['requestBody']['content']['application/json']

export const VerificationWorkflow = () => {
  const { state, verify, verifyBusiness, clearResult } = useVerification()
  const toast = useToast()

  const [bpmnContent, setBpmnContent] = useState('')
  const [bpmnFormat, setBpmnFormat] = useState<'xml' | 'json'>('xml')
  const [verificationType, setVerificationType] = useState<VerificationType>('all')
  const [verificationOptions, setVerificationOptions] = useState({
    detailed: true,
    include_suggestions: true,
  })
  // Business verification inputs
  const [businessDomain, setBusinessDomain] = useState('')
  const [businessLocale, setBusinessLocale] = useState('')
  const [useContextJson, setUseContextJson] = useState('')
  const [summaryJson, setSummaryJson] = useState('')

  const handleLoadBpmnFile = async (file: File) => {
    const text = await file.text()
    setBpmnContent(text)
    const format: 'xml' | 'json' = file.name.endsWith('.json') ? 'json' : 'xml'
    setBpmnFormat(format)
  }

  const handleVerify = () => {
    if (!bpmnContent.trim()) {
      toast.showError('Please provide BPMN content')
      return
    }

    // Parse optional business verification inputs
    let useContext = null
    let summary = null

    if (verificationType === 'all' && (useContextJson.trim() || summaryJson.trim())) {
      try {
        if (useContextJson.trim()) {
          useContext = JSON.parse(useContextJson)
        }
        if (summaryJson.trim()) {
          summary = JSON.parse(summaryJson)
        }
      } catch {
        toast.showError('Invalid JSON in use context or summary fields')
        return
      }
    }

    // Build request based on verification type
    if (
      verificationType === 'business' ||
      (verificationType === 'all' && (businessDomain || useContext || summary))
    ) {
      const businessRequest: BusinessVerificationRequestType = {
        bpmn: {
          content: bpmnContent,
          format: bpmnFormat,
        },
        domain: businessDomain || 'general',
        locale: businessLocale || null,
        use_context: useContext,
        summary: summary,
        options: verificationOptions,
      }
      verifyBusiness(businessRequest)
      return
    }

    const request: VerificationRequestType = {
      bpmn: {
        content: bpmnContent,
        format: bpmnFormat,
      },
      options: verificationOptions,
    }

    verify(request, verificationType)

    // Run business verification separately if business fields are provided
    if (businessDomain || useContext || summary) {
      const businessRequest = {
        bpmn: {
          content: bpmnContent,
          format: bpmnFormat,
        },
        domain: businessDomain || 'general',
        locale: businessLocale || null,
        use_context: useContext || undefined,
        summary: summary || undefined,
        options: verificationOptions,
      }
      verifyBusiness(businessRequest)
    }
  }

  const tabs = [
    {
      id: 'input',
      label: 'Input',
      content: (
        <div className="verification-input-tab">
          <div className="verification-input-section">
            <div className="verification-input-header">
              <h3>BPMN Input</h3>
              <p>Provide BPMN content to verify</p>
            </div>
            <div className="verification-input-controls">
              <div className="verification-input-actions-top">
                <div className="verification-format-toggle">
                  <Button
                    variant={bpmnFormat === 'xml' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setBpmnFormat('xml')}
                  >
                    XML
                  </Button>
                  <Button
                    variant={bpmnFormat === 'json' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setBpmnFormat('json')}
                  >
                    JSON
                  </Button>
                </div>
                <label className="verification-input-file-label">
                  <input
                    type="file"
                    accept=".bpmn,.xml,.json"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleLoadBpmnFile(file)
                      }
                      e.target.value = ''
                    }}
                    className="verification-input-file-input"
                  />
                  <span className="button button-ghost button-sm">Load BPMN File</span>
                </label>
              </div>

              <div className="verification-editor-container">
                <textarea
                  className="w-full h-64 p-3 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={bpmnContent}
                  onChange={e => setBpmnContent(e.target.value)}
                  placeholder={`Paste your BPMN ${bpmnFormat.toUpperCase()} content here...`}
                />
              </div>

              <div className="verification-options-section">
                <h4 className="verification-options-title">Verification Options</h4>
                <div className="verification-options-controls">
                  <div className="verification-type-selection">
                    <label className="verification-type-label">Verification Type:</label>
                    <div className="verification-type-buttons">
                      <Button
                        variant={verificationType === 'structural' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setVerificationType('structural')}
                      >
                        Structural
                      </Button>
                      <Button
                        variant={verificationType === 'behavioral' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setVerificationType('behavioral')}
                      >
                        Behavioral
                      </Button>
                      <Button
                        variant={verificationType === 'all' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setVerificationType('all')}
                      >
                        All
                      </Button>
                    </div>
                  </div>
                  <label className="verification-option-checkbox">
                    <input
                      type="checkbox"
                      checked={verificationOptions.detailed}
                      onChange={e =>
                        setVerificationOptions(prev => ({ ...prev, detailed: e.target.checked }))
                      }
                    />
                    Detailed verification
                  </label>
                  <label className="verification-option-checkbox">
                    <input
                      type="checkbox"
                      checked={verificationOptions.include_suggestions}
                      onChange={e =>
                        setVerificationOptions(prev => ({
                          ...prev,
                          include_suggestions: e.target.checked,
                        }))
                      }
                    />
                    Include suggestions
                  </label>
                </div>
              </div>

              {/* Business Verification Options */}
              {verificationType === 'all' && (
                <div className="verification-business-section">
                  <h4 className="verification-business-title">
                    Business Verification (Optional - Recommended)
                  </h4>
                  <p className="verification-business-hint">
                    Provide use context and process summary for enhanced business rule analysis
                  </p>
                  <div className="verification-business-inputs">
                    <Input
                      label="Domain"
                      value={businessDomain}
                      onChange={e => setBusinessDomain(e.target.value)}
                      placeholder="e.g., hr, finance, manufacturing"
                    />
                    <Input
                      label="Locale"
                      value={businessLocale}
                      onChange={e => setBusinessLocale(e.target.value)}
                      placeholder="e.g., es-AR, en-US"
                    />
                    <div className="verification-business-json-inputs">
                      <div className="verification-business-json-input">
                        <label className="verification-business-json-label">
                          Use Context (JSON) - Optional
                        </label>
                        <textarea
                          className="verification-business-json-textarea"
                          value={useContextJson}
                          onChange={e => setUseContextJson(e.target.value)}
                          placeholder='{"domain": "hr", "locale": "es-AR", ...}'
                          rows={4}
                        />
                        <p className="verification-business-json-hint">
                          Paste use context JSON
                        </p>
                      </div>
                      <div className="verification-business-json-input">
                        <label className="verification-business-json-label">
                          Process Summary (JSON) - Optional
                        </label>
                        <textarea
                          className="verification-business-json-textarea"
                          value={summaryJson}
                          onChange={e => setSummaryJson(e.target.value)}
                          placeholder='{"summary": "...", "actors": [...], ...}'
                          rows={4}
                        />
                        <p className="verification-business-json-hint">
                          Paste process summary JSON
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="verification-input-actions">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleVerify}
                  isLoading={state.isLoading || state.isBusinessLoading}
                  disabled={!bpmnContent.trim() || state.isLoading || state.isBusinessLoading}
                >
                  Run Verification
                </Button>
                <Button variant="ghost" size="md" onClick={clearResult}>
                  Clear Results
                </Button>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'results',
      label: 'Results',
      content: (
        <div className="verification-results-tab">
          {state.isLoading || state.isBusinessLoading ? (
            <div className="verification-loading">
              <LoadingSpinner />
              <p>
                {state.isLoading ? 'Running verification...' : 'Running business verification...'}
              </p>
            </div>
          ) : state.error || state.businessError ? (
            <div className="verification-error">
              <h3>Error</h3>
              <p>{state.error}</p>
              <Button variant="secondary" onClick={clearResult}>
                Clear
              </Button>
            </div>
          ) : state.result || state.businessResult ? (
            <div className="verification-results-content">
              {state.result && <VerificationResults verification={state.result} />}
              {state.businessResult && <BusinessResults result={state.businessResult} />}
            </div>
          ) : (
            <div className="verification-empty-state">
              <p>No verification results available.</p>
              <p className="verification-empty-hint">
                Go to the "Input" tab to verify a BPMN file.
              </p>
            </div>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="verification-workflow-container">
      <div className="verification-workflow-header">
        <h1>BPMN Verification</h1>
        <p>Verify structural and behavioral properties of BPMN diagrams.</p>
      </div>
      <div className="verification-workflow-content">
        <Tabs tabs={tabs} />
      </div>
    </div>
  )
}

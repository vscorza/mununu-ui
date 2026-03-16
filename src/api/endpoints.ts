import { apiClient, aiApiClient } from './client'
import type { paths } from './types'

// Type aliases for cleaner code
type TranslateBpmRequest =
  paths['/api/v1/translate/bpm']['post']['requestBody']['content']['application/json']
type TranslateBpmResponse =
  paths['/api/v1/translate/bpm']['post']['responses']['200']['content']['application/json']

type AsyncTranslationResponse =
  paths['/api/v1/translate/bpm/async']['post']['responses']['202']['content']['application/json']
type JobStatusResponse =
  paths['/api/v1/translate/bpm/status/{job_id}']['get']['responses']['200']['content']['application/json']

type BatchTranslateBpmRequest =
  paths['/api/v1/translate/bpm/batch']['post']['requestBody']['content']['application/json']
type BatchTranslateBpmResponse =
  paths['/api/v1/translate/bpm/batch']['post']['responses']['200']['content']['application/json']

type VerificationRequest =
  paths['/api/v1/bpm/verify/structural']['post']['requestBody']['content']['application/json']
type VerificationResponse =
  paths['/api/v1/bpm/verify/structural']['post']['responses']['200']['content']['application/json']

type ContextSummarizeRequest =
  paths['/api/v1/context/summarize']['post']['requestBody']['content']['application/json']
type ContextSummarizeResponse =
  paths['/api/v1/context/summarize']['post']['responses']['200']['content']['application/json']

type ContextSynthesizeRequest =
  paths['/api/v1/context/synthesize']['post']['requestBody']['content']['application/json']
type ContextSynthesizeResponse =
  paths['/api/v1/context/synthesize']['post']['responses']['200']['content']['application/json']

type ContextGraphsRequest =
  paths['/api/v1/context/graphs']['post']['requestBody']['content']['application/json']
type ContextGraphsResponse =
  paths['/api/v1/context/graphs']['post']['responses']['200']['content']['application/json']

// Translation endpoints
export const translateBpm = async (request: TranslateBpmRequest): Promise<TranslateBpmResponse> => {
  const response = await apiClient.post<TranslateBpmResponse>('/translate/bpm', request)
  return response.data
}

// Context endpoints
export const summarizeContext = async (
  request: ContextSummarizeRequest
): Promise<ContextSummarizeResponse> => {
  const response = await apiClient.post<ContextSummarizeResponse>('/context/summarize', request)
  return response.data
}

export const synthesizeController = async (
  request: ContextSynthesizeRequest
): Promise<ContextSynthesizeResponse> => {
  const response = await apiClient.post<ContextSynthesizeResponse>('/context/synthesize', request)
  return response.data
}

export const getContextGraphs = async (
  request: ContextGraphsRequest
): Promise<ContextGraphsResponse> => {
  const response = await apiClient.post<ContextGraphsResponse>('/context/graphs', request)
  return response.data
}

// Async translation endpoints
export const translateBpmAsync = async (
  request: TranslateBpmRequest
): Promise<AsyncTranslationResponse> => {
  const response = await apiClient.post<AsyncTranslationResponse>('/translate/bpm/async', request)
  return response.data
}

export const getTranslationJobStatus = async (jobId: string): Promise<JobStatusResponse> => {
  const response = await apiClient.get<JobStatusResponse>(`/translate/bpm/status/${jobId}`)
  return response.data
}

export const getTranslationJobResult = async (jobId: string): Promise<TranslateBpmResponse> => {
  const response = await apiClient.get<TranslateBpmResponse>(`/translate/bpm/result/${jobId}`)
  return response.data
}

// Batch translation endpoint
export const translateBpmBatch = async (
  request: BatchTranslateBpmRequest
): Promise<BatchTranslateBpmResponse> => {
  const response = await apiClient.post<BatchTranslateBpmResponse>('/translate/bpm/batch', request)
  return response.data
}

// Verification endpoints
export const verifyStructural = async (
  request: VerificationRequest
): Promise<VerificationResponse> => {
  const response = await apiClient.post<VerificationResponse>('/bpm/verify/structural', request)
  return response.data
}

export const verifyBehavioral = async (
  request: VerificationRequest
): Promise<VerificationResponse> => {
  const response = await apiClient.post<VerificationResponse>('/bpm/verify/behavioral', request)
  return response.data
}

export const verifyAll = async (request: VerificationRequest): Promise<VerificationResponse> => {
  const response = await apiClient.post<VerificationResponse>('/bpm/verify/all', request)
  return response.data
}

// Business verification endpoint (separate from structural/behavioral)
export type BusinessVerificationRequest =
  paths['/api/v1/bpm/verify/business']['post']['requestBody']['content']['application/json']
export type BusinessVerificationResult =
  paths['/api/v1/bpm/verify/business']['post']['responses']['200']['content']['application/json']

export const verifyBusiness = async (
  request: BusinessVerificationRequest
): Promise<BusinessVerificationResult> => {
  // Business verification can take 30+ seconds, use aiApiClient with extended timeout
  const response = await aiApiClient.post<BusinessVerificationResult>(
    '/bpm/verify/business',
    request
  )
  return response.data
}

// Process Context endpoints
type SummarizeUseContextRequest =
  paths['/api/v1/process/context/summarize']['post']['requestBody']['content']['application/json']
type SummarizeUseContextResponse =
  paths['/api/v1/process/context/summarize']['post']['responses']['200']['content']['application/json']

type EventLogSuggestionsRequest =
  paths['/api/v1/process/context/event-logs']['post']['requestBody']['content']['application/json']
type EventLogSuggestionsResponse =
  paths['/api/v1/process/context/event-logs']['post']['responses']['200']['content']['application/json']

type ExtractIrFromSummaryRequest =
  paths['/api/v1/process/context/extract-ir']['post']['requestBody']['content']['application/json']
type ExtractIrFromSummaryResponse =
  paths['/api/v1/process/context/extract-ir']['post']['responses']['200']['content']['application/json']

type ProcessContextPipelineRequest =
  paths['/api/v1/process/context/pipeline']['post']['requestBody']['content']['application/json']
type ProcessContextPipelineResponse =
  paths['/api/v1/process/context/pipeline']['post']['responses']['200']['content']['application/json']

export const summarizeUseContext = async (
  request: SummarizeUseContextRequest
): Promise<SummarizeUseContextResponse> => {
  const response = await aiApiClient.post<SummarizeUseContextResponse>(
    '/process/context/summarize',
    request
  )
  return response.data
}

export const suggestEventLogs = async (
  request: EventLogSuggestionsRequest
): Promise<EventLogSuggestionsResponse> => {
  const response = await aiApiClient.post<EventLogSuggestionsResponse>(
    '/process/context/event-logs',
    request
  )
  return response.data
}

export const extractIrFromSummary = async (
  request: ExtractIrFromSummaryRequest
): Promise<ExtractIrFromSummaryResponse> => {
  const response = await aiApiClient.post<ExtractIrFromSummaryResponse>(
    '/process/context/extract-ir',
    request
  )
  return response.data
}

export const processContextPipeline = async (
  request: ProcessContextPipelineRequest
): Promise<ProcessContextPipelineResponse> => {
  const response = await aiApiClient.post<ProcessContextPipelineResponse>(
    '/process/context/pipeline',
    request
  )
  return response.data
}

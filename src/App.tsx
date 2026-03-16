import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from './components/ErrorBoundary'
import { MainLayout } from './components/layout/MainLayout'
import { Home } from './pages/Home'
import { CtxdslEditor } from './components/editors/CtxdslEditor'
import { SummaryView } from './components/visualization/SummaryView'
import { GraphsView } from './components/visualization/GraphsView'
import { SynthesisWorkflow } from './components/workflows/SynthesisWorkflow'
import { VerificationWorkflow } from './components/workflows/VerificationWorkflow'
import { TutorialOverlay } from './tutorials/components/TutorialOverlay'
import { AnalyticsViewer } from './components/common/AnalyticsViewer'
import { OfflineIndicator } from './components/common/OfflineIndicator'
import { useAppStore } from './store/appStore'
import { KeyboardShortcutsProvider } from './components/KeyboardShortcutsProvider'
import { useEffect } from 'react'

function App() {
  const { theme, setTheme } = useAppStore()

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark'
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [setTheme])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <KeyboardShortcutsProvider>
          <TutorialOverlay />
          <MainLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              <Route path="/editor/ctxdsl" element={<CtxdslEditor />} />
              <Route path="/visualization/summary" element={<SummaryView />} />
              <Route path="/visualization/graphs" element={<GraphsView />} />
              <Route path="/workflows/verification" element={<VerificationWorkflow />} />
              <Route path="/workflows/synthesis" element={<SynthesisWorkflow />} />
            </Routes>
          </MainLayout>
        </KeyboardShortcutsProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--toast-bg, #fff)',
              color: 'var(--toast-color, #333)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <AnalyticsViewer />
        <OfflineIndicator />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App

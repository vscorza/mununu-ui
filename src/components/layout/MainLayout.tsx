import { ReactNode } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useAppStore } from '../../store/appStore'
import './Layout.css'

interface MainLayoutProps {
  children: ReactNode
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { sidebarOpen, toggleSidebar } = useAppStore()

  return (
    <div className="main-layout">
      <Header />
      <div className="main-layout-body">
        <Sidebar />
        <main className={`main-layout-main ${sidebarOpen ? 'main-layout-main-with-sidebar' : ''}`}>
          <div className="main-layout-content">
            {/* Toggle sidebar button */}
            <button
              onClick={toggleSidebar}
              className="fixed top-20 left-4 z-30 p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle sidebar"
              aria-expanded={sidebarOpen}
              aria-controls="sidebar-navigation"
            >
              <svg
                className="w-6 h-6 text-gray-600 dark:text-gray-300"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {sidebarOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <div className="main-layout-content-inner">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}

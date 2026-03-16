import { Link, useLocation } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import { Button } from '../common/Button'

interface NavItem {
  path: string
  label: string
  icon?: string
}

const navItems: NavItem[] = [
  { path: '/home', label: 'Home', icon: '🏠' },
  { path: '/editor/ctxdsl', label: 'CTXDSL Editor', icon: '📝' },
  { path: '/visualization/summary', label: 'Summary', icon: '📋' },
  { path: '/visualization/graphs', label: 'Graphs', icon: '🕸️' },
  { path: '/workflows/verification', label: 'Verification', icon: '✓' },
  { path: '/workflows/synthesis', label: 'Synthesis', icon: '⚙️' },
]

export const Sidebar = () => {
  const location = useLocation()
  const { sidebarOpen, toggleSidebar } = useAppStore()

  return (
    <>
      {/* Overlay - transparent, only for click-to-close functionality on mobile */}
      {/* No dark background to prevent canvas darkening */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden pointer-events-auto"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar-navigation"
        className={`
          fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-label="Sidebar navigation"
        aria-hidden={!sidebarOpen}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Navigation</h2>
            <Button variant="ghost" size="sm" onClick={toggleSidebar} aria-label="Close sidebar">
              ✕
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4" aria-label="Sidebar navigation">
            <ul className="space-y-1" role="list">
              {navItems.map(item => {
                const isActive = location.pathname === item.path
                return (
                  <li key={item.path} role="listitem">
                    <Link
                      to={item.path}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                        ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600 dark:from-blue-500/30 dark:to-purple-500/30 dark:text-blue-400 border-l-4 border-blue-500 shadow-sm'
                            : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:text-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 hover:shadow-sm'
                        }
                      `}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => {
                        // Close sidebar after navigation
                        toggleSidebar()
                      }}
                    >
                      {item.icon && (
                        <span aria-hidden="true" className="text-lg">
                          {item.icon}
                        </span>
                      )}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  )
}

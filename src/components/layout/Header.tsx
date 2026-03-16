import { Link, useLocation } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import { Button } from '../common/Button'
import { TutorialLauncher } from '../../tutorials/components/TutorialLauncher'
import { KeyboardShortcutsHelp } from '../common/KeyboardShortcutsHelp'
import { LanguageSelector } from '../common/LanguageSelector'

export const Header = () => {
  const location = useLocation()
  const { theme, toggleTheme } = useAppStore()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white via-blue-50/30 to-purple-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-purple-900/20 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="HOLIDAY" className="h-8 w-auto" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Web Client</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/home"
            className={`text-sm font-medium transition-all duration-200 px-3 py-1.5 rounded-md ${
              location.pathname === '/home'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/30 font-semibold'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20'
            }`}
          >
            Home
          </Link>
          <Link
            to="/editor"
            className={`text-sm font-medium transition-all duration-200 px-3 py-1.5 rounded-md ${
              location.pathname.startsWith('/editor')
                ? 'text-purple-600 dark:text-purple-400 bg-purple-100/50 dark:bg-purple-900/30 font-semibold'
                : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/50 dark:text-gray-400 dark:hover:text-purple-400 dark:hover:bg-purple-900/20'
            }`}
          >
            Editor
          </Link>
          <Link
            to="/visualization"
            className={`text-sm font-medium transition-all duration-200 px-3 py-1.5 rounded-md ${
              location.pathname.startsWith('/visualization')
                ? 'text-teal-600 dark:text-teal-400 bg-teal-100/50 dark:bg-teal-900/30 font-semibold'
                : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50/50 dark:text-gray-400 dark:hover:text-teal-400 dark:hover:bg-teal-900/20'
            }`}
          >
            Visualization
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <TutorialLauncher />
          <KeyboardShortcutsHelp />
          <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </Button>
        </div>
      </div>
    </header>
  )
}

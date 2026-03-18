import { useHotkeys } from 'react-hotkeys-hook'
import { useAppStore } from '../store/appStore'

export const useKeyboardShortcuts = () => {
  const { toggleTheme } = useAppStore()

  // UI shortcuts
  useHotkeys('ctrl+shift+d,cmd+shift+d', () => toggleTheme(), { preventDefault: true })

  // Editor shortcuts are handled by Monaco itself

  return null
}

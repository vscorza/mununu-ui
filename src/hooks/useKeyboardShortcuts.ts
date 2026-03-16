import { useHotkeys } from 'react-hotkeys-hook'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate()
  const { toggleSidebar, toggleTheme } = useAppStore()

  // Navigation shortcuts
  useHotkeys('g h', () => navigate('/'), { preventDefault: true })
  useHotkeys('g e', () => navigate('/editor/ctxdsl'), { preventDefault: true })
  useHotkeys('g b', () => navigate('/editor/bpmn'), { preventDefault: true })
  useHotkeys('g s', () => navigate('/visualization/summary'), { preventDefault: true })
  useHotkeys('g g', () => navigate('/visualization/graphs'), { preventDefault: true })
  useHotkeys('g t', () => navigate('/workflows/translation'), { preventDefault: true })
  useHotkeys('g y', () => navigate('/workflows/synthesis'), { preventDefault: true })

  // UI shortcuts
  useHotkeys('ctrl+b,cmd+b', () => toggleSidebar(), { preventDefault: true })
  useHotkeys('ctrl+shift+d,cmd+shift+d', () => toggleTheme(), { preventDefault: true })

  // Editor shortcuts (handled by Monaco/bpmn-js)
  // These are already handled by the editors themselves

  return null
}

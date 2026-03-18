import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import './KeyboardShortcutsHelp.css'

interface Shortcut {
  keys: string[]
  description: string
  category: string
}

const shortcuts: Shortcut[] = [
  { keys: ['Ctrl+Shift+D', 'Cmd+Shift+D'], description: 'Toggle Dark/Light Theme', category: 'UI' },
  { keys: ['Ctrl+S', 'Cmd+S'], description: 'Save (in editor)', category: 'Editor' },
  { keys: ['Ctrl+Z', 'Cmd+Z'], description: 'Undo (in editor)', category: 'Editor' },
  { keys: ['Ctrl+Shift+Z', 'Cmd+Shift+Z'], description: 'Redo (in editor)', category: 'Editor' },
  { keys: ['Ctrl+F', 'Cmd+F'], description: 'Find (in editor)', category: 'Editor' },
]

export const KeyboardShortcutsHelp = () => {
  const [isOpen, setIsOpen] = useState(false)

  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = []
      }
      acc[shortcut.category].push(shortcut)
      return acc
    },
    {} as Record<string, Shortcut[]>
  )

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)} title="Keyboard shortcuts">
        Shortcuts
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Keyboard Shortcuts"
        footer={
          <Button variant="primary" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="keyboard-shortcuts-help">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category} className="keyboard-shortcuts-category">
              <h3 className="keyboard-shortcuts-category-title">{category}</h3>
              <div className="keyboard-shortcuts-list">
                {categoryShortcuts.map((shortcut, index) => (
                  <div key={index} className="keyboard-shortcut-item">
                    <div className="keyboard-shortcut-keys">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="keyboard-shortcut-key">
                          {key}
                        </span>
                      ))}
                    </div>
                    <div className="keyboard-shortcut-description">{shortcut.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  )
}

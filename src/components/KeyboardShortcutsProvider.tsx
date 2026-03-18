import { ReactNode } from "react";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
}

/**
 * Provider component that initializes keyboard shortcuts.
 * Must be rendered inside a Router context.
 */
export const KeyboardShortcutsProvider = ({
  children,
}: KeyboardShortcutsProviderProps) => {
  useKeyboardShortcuts();
  return <>{children}</>;
};

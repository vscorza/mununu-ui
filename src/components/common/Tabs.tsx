import { ReactNode, useState } from "react";
import "./Tabs.css";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
}

export const Tabs = ({ tabs, defaultTab, onChange }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className="tabs-container">
      <div className="tabs-nav">
        <nav className="tabs-nav-list" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && handleTabChange(tab.id)}
              disabled={tab.disabled}
              className={`tabs-button ${activeTab === tab.id ? "tabs-button-active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="tabs-content">{activeTabContent}</div>
    </div>
  );
};

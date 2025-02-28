// src/components/admin/TabNavigation.tsx
import { TabItem } from '../../types';

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TabNavigation = ({ tabs, activeTab, onTabChange }: TabNavigationProps) => {
  return (
    <ul className="nav nav-tabs mb-4">
      {tabs.map(tab => (
        <li className="nav-item" key={tab.id}>
          <button
            className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon && <i className={`bi bi-${tab.icon} me-2`}></i>}
            {tab.label}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default TabNavigation;
'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type TabId = 'overview' | 'career' | 'analytics' | 'compete';

export interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

export const TABS: Tab[] = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'career', label: 'Career', icon: '📊' },
  { id: 'analytics', label: 'Analytics', icon: '🔬' },
  { id: 'compete', label: 'Compete', icon: '⚔️' },
];

export const TAB_IDS = TABS.map(t => t.id);

export function isValidTabId(value: string): value is TabId {
  return TAB_IDS.includes(value as TabId);
}

interface ProfileTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: ReactNode;
}

export function ProfileTabs({ activeTab, onTabChange, children }: ProfileTabsProps) {
  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex items-center justify-center mb-8">
        <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300',
                  isActive
                    ? 'bg-white/[0.1] text-white shadow-lg shadow-black/20'
                    : 'text-text-muted hover:text-white hover:bg-white/[0.05]'
                )}
              >
                <span className={cn('text-base transition-transform duration-300', isActive && 'scale-110')}>
                  {tab.icon}
                </span>
                <span className="hidden sm:inline">{tab.label}</span>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in-up">
        {children}
      </div>
    </div>
  );
}

interface TabPanelProps {
  tabId: TabId;
  activeTab: TabId;
  children: ReactNode;
}

export function TabPanel({ tabId, activeTab, children }: TabPanelProps) {
  if (tabId !== activeTab) return null;

  return (
    <div className="animate-fade-in-up">
      {children}
    </div>
  );
}

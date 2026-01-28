'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type TabId = 'overview' | 'career' | 'analytics' | 'badges' | 'compete';

export interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

export const TABS: Tab[] = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'career', label: 'Career', icon: '📊' },
  { id: 'analytics', label: 'Analytics', icon: '🔬' },
  { id: 'badges', label: 'Badges', icon: '🏅' },
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
      <div className="relative mb-10">
        {/* Ambient glow behind tabs */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-80 h-20 bg-violet-500/10 rounded-full blur-3xl" />
        </div>

        <nav className="relative flex items-center justify-center" role="tablist">
          <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/[0.08] backdrop-blur-xl shadow-2xl shadow-black/40">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => onTabChange(tab.id)}
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  role="tab"
                  tabIndex={isActive ? 0 : -1}
                  className={cn(
                    'group relative flex items-center gap-2.5 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-300 ease-out',
                    isActive
                      ? 'text-white'
                      : 'text-zinc-500 hover:text-zinc-300'
                  )}
                >
                  {/* Active background with gradient */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.12] to-white/[0.06] border border-white/[0.15] shadow-lg shadow-violet-500/10" />
                  )}

                  {/* Hover glow */}
                  <div className={cn(
                    'absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300',
                    !isActive && 'group-hover:opacity-100 bg-gradient-to-b from-white/[0.04] to-transparent'
                  )} />

                  {/* Icon with scale animation */}
                  <span className={cn(
                    'relative z-10 text-base transition-all duration-300',
                    isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'group-hover:scale-105'
                  )}>
                    {tab.icon}
                  </span>

                  {/* Label with reveal animation on desktop */}
                  <span className={cn(
                    'relative z-10 hidden sm:inline transition-all duration-300',
                    isActive ? 'text-white' : 'text-inherit'
                  )}>
                    {tab.label}
                  </span>

                  {/* Active indicator line */}
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r from-violet-500 via-violet-400 to-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.6)]" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Subtle divider below */}
        <div className="mt-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
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
    <div
      id={`tabpanel-${tabId}`}
      role="tabpanel"
      aria-labelledby={`tab-${tabId}`}
    >
      {children}
    </div>
  );
}

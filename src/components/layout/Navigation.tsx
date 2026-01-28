'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useAuth, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GitHubAuthModal } from '@/components/auth/GitHubAuthModal';

interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Analyze', href: '/', icon: '🔍' },
  { label: 'Leaderboard', href: '/leaderboard', icon: '📊' },
  { label: 'Launch Week', href: '/launch', icon: '🚀' },
  { label: 'Station', href: '/station', icon: '🛸', badge: 'NEW' },
  { label: 'Roasting', href: '/board', icon: '🔥' },
  { label: 'Hall of Fame', href: '/hall-of-fame', icon: '🏆' },
  { label: 'Trends', href: '/trends', icon: '📈' },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  // Get GitHub username from Clerk user metadata
  const githubUsername = user?.externalAccounts?.find(
    (acc) => acc.provider === 'github'
  )?.username || user?.username;

  // Don't show nav on analyze pages (they have their own header)
  const hideNav = pathname?.startsWith('/analyze/');

  if (hideNav) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg-primary/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-bold text-text-highlight group-hover:text-primary-400 transition-colors">
              DevPersona
            </span>
            <span className="hidden sm:inline text-xs px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400 font-medium">
              V2
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    "hover:bg-bg-tertiary",
                    isActive
                      ? "text-text-primary bg-bg-tertiary"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary-500 text-white font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* CTA Button + Auth */}
          <div className="hidden md:flex items-center gap-3">
            <Button size="sm" variant="ghost" asChild>
              <Link href="/compare">Compare Devs</Link>
            </Button>
            {isLoaded && (
              isSignedIn ? (
                <UserButton afterSignOutUrl="/">
                  <UserButton.MenuItems>
                    {githubUsername && (
                      <>
                        <UserButton.Link
                          label="My Profile"
                          labelIcon={<span className="text-sm">👤</span>}
                          href={`/profile/${githubUsername}`}
                        />
                        <UserButton.Link
                          label="My Analysis"
                          labelIcon={<span className="text-sm">📊</span>}
                          href={`/analyze/${githubUsername}`}
                        />
                      </>
                    )}
                  </UserButton.MenuItems>
                </UserButton>
              ) : (
                <Button size="sm" className="gap-2" onClick={() => setAuthModalOpen(true)}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Sign In
                </Button>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-bg-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <svg
              className="w-6 h-6 text-text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      "flex items-center gap-2",
                      isActive
                        ? "text-text-primary bg-bg-tertiary"
                        : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                    )}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary-500 text-white font-semibold ml-auto">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
              <div className="mt-2 pt-2 border-t border-border space-y-2">
                <Button className="w-full" size="sm" variant="outline" asChild>
                  <Link href="/compare" onClick={() => setMobileMenuOpen(false)}>Compare Devs</Link>
                </Button>
                {isLoaded && isSignedIn && githubUsername && (
                  <>
                    <Button className="w-full gap-2" size="sm" variant="outline" asChild>
                      <Link href={`/analyze/${githubUsername}`} onClick={() => setMobileMenuOpen(false)}>
                        <span>📊</span>
                        My Analysis
                      </Link>
                    </Button>
                    <Button className="w-full gap-2" size="sm" variant="outline" asChild>
                      <Link href={`/profile/${githubUsername}`} onClick={() => setMobileMenuOpen(false)}>
                        <span>👤</span>
                        My Profile
                      </Link>
                    </Button>
                  </>
                )}
                {isLoaded && (
                  isSignedIn ? (
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-tertiary">
                      <span className="text-sm text-text-secondary">Account Settings</span>
                      <UserButton afterSignOutUrl="/" />
                    </div>
                  ) : (
                    <Button className="w-full gap-2" size="sm" onClick={() => { setAuthModalOpen(true); setMobileMenuOpen(false); }}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      Sign In with GitHub
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* GitHub Auth Modal */}
      <GitHubAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode="sign-in"
      />
    </nav>
  );
}

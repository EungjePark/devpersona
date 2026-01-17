'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { SignalBreakdown } from '@/lib/analysis/breakdowns';
import { cn } from '@/lib/utils';

interface ScoreBreakdownModalProps {
  breakdown: SignalBreakdown | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ScoreBreakdownModal({ breakdown, isOpen, onClose }: ScoreBreakdownModalProps) {
  if (!breakdown) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-yellow-400';
    if (score >= 75) return 'text-purple-400';
    if (score >= 50) return 'text-blue-400';
    return 'text-zinc-400';
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="bg-[#141419] border border-white/10 rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className={cn('text-4xl font-black', getScoreColor(breakdown.score))}>
                  {breakdown.score}
                </div>
                <div>
                  <Dialog.Title className="text-lg font-bold text-white">
                    {breakdown.displayName}
                  </Dialog.Title>
                  <p className="text-sm text-zinc-400">Score Breakdown</p>
                </div>
              </div>
              <Dialog.Close asChild>
                <button
                  className="rounded-full p-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>

            {/* Formula */}
            <div className="p-6 border-b border-white/5">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Formula</h3>
              <code className="text-sm text-cyan-400 bg-white/5 px-3 py-2 rounded-lg block overflow-x-auto">
                {breakdown.formula}
              </code>
            </div>

            {/* Breakdown Items */}
            <div className="p-6 border-b border-white/5">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Components</h3>
              <div className="space-y-3">
                {breakdown.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-sm text-zinc-300">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono text-white">
                        {typeof item.value === 'number' && item.value > 1000
                          ? `${(item.value / 1000).toFixed(1)}K`
                          : item.value}
                      </span>
                      <span className="text-xs text-zinc-500">
                        ×{item.weight}
                      </span>
                      <div className="w-20 bg-white/5 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (item.contribution / breakdown.score) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="p-6">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Tips to Improve</h3>
              <ul className="space-y-2">
                {breakdown.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-zinc-400">
                    <span className="text-green-400 mt-0.5">+</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

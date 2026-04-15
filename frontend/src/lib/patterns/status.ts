/**
 * Status bar patterns.
 *
 * Covers:  layout/StatusBar.tsx
 */

export const statusBarPatterns = {
  bar: "flex items-center gap-3 px-3 h-6 bg-[#0a0a0a] border-t border-white/[0.05] shrink-0",
  separator: "w-px h-3 bg-white/[0.07]",
  spacer: "flex-1",

  // Individual status item
  item: "flex items-center gap-1 text-[9px] text-zinc-600",
  itemHighlight: "text-zinc-400",
  itemError: "text-red-400",
  itemSuccess: "text-emerald-400",
  itemWarning: "text-amber-400",
  itemIcon: "w-2.5 h-2.5",

  // Activity indicator (spinner / pulse)
  activity: {
    idle: "w-1.5 h-1.5 rounded-full bg-zinc-700",
    working: "w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse",
    done: "w-1.5 h-1.5 rounded-full bg-emerald-500",
    error: "w-1.5 h-1.5 rounded-full bg-red-500",
  },

  // Progress mini-bar (morph target recalculation etc.)
  progressBar: {
    wrapper: "flex items-center gap-1",
    track: "w-16 h-0.5 bg-white/[0.08] rounded-full overflow-hidden",
    fill: "h-full bg-orange-500 rounded-full transition-all",
  },
} as const;

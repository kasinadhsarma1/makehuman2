/**
 * Button patterns — all button variants used in MakeHuman2.
 *
 * Mirrors ropods-store pattern nesting (button.base, button.default,
 * button.disabled) while keeping the dark-UI accent palette.
 */

export const buttonPatterns = {
  // Shared base — apply before variant
  base: "flex items-center justify-center gap-1.5 rounded font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed",

  // --- Variants ---
  primary:
    "bg-violet-700 hover:bg-violet-600 text-white text-[10px] font-semibold transition-colors disabled:opacity-40",
  secondary:
    "bg-white/[0.05] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.09] text-[10px] font-semibold transition-colors disabled:opacity-40",
  danger:
    "bg-red-900/30 hover:bg-red-800/50 border border-red-700/30 text-red-300 text-[10px] font-semibold transition-colors disabled:opacity-40",
  ghost:
    "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] text-[10px] font-semibold transition-colors disabled:opacity-40",
  accent:
    "bg-orange-600/80 hover:bg-orange-500/80 text-white text-[10px] font-semibold transition-colors disabled:opacity-40",

  // --- Size variants ---
  size: {
    xs: "px-2 py-1 text-[9px]",
    sm: "px-2.5 py-1.5 text-[10px]",
    md: "px-3 py-1.5 text-xs",
    lg: "px-4 py-2 text-sm",
  },

  // --- Category / tab buttons (ropods-style active/inactive) ---
  category: {
    active: "bg-orange-600/80 text-white text-[10px] font-semibold rounded px-2 py-1 transition-colors",
    inactive:
      "text-zinc-500 hover:bg-white/[0.07] hover:text-zinc-300 text-[10px] font-semibold rounded px-2 py-1 transition-colors",
  },

  // --- Icon-only buttons ---
  icon: {
    tiny: "w-4 h-4 rounded bg-white/[0.04] text-zinc-500 hover:text-zinc-200 flex items-center justify-center shrink-0 transition-colors",
    small: "w-5 h-5 rounded bg-white/[0.04] text-zinc-500 hover:text-zinc-200 flex items-center justify-center shrink-0 transition-colors",
    medium: "w-6 h-6 rounded bg-white/[0.04] text-zinc-500 hover:text-zinc-200 flex items-center justify-center shrink-0 transition-colors",
  },

  // --- Action row (multiple buttons side by side) ---
  actionRow: "flex items-center gap-1.5",
  actionSmall:
    "flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-semibold transition-colors disabled:opacity-40",
} as const;

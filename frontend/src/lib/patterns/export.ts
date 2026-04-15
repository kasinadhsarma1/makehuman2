/**
 * Export dialog / panel patterns.
 *
 * Covers:  panels/FilesPanels.tsx  (export section)
 *
 * Mirrors ropods-store checkoutPatterns structure (form, summary, button)
 * adapted for a 3D export format picker.
 */

export const exportPatterns = {
  // --- Format selector cards ---
  formatGrid: {
    wrapper: "grid grid-cols-2 gap-2 px-3 py-2",
    card: "flex flex-col items-center justify-center gap-1 p-2.5 rounded border cursor-pointer transition-all",
    cardActive: "border-orange-500/50 bg-orange-600/10 text-orange-300",
    cardInactive: "border-white/[0.07] bg-white/[0.02] text-zinc-500 hover:border-white/[0.14] hover:text-zinc-300",
    icon: "w-5 h-5",
    label: "text-[10px] font-semibold",
    badge: "text-[9px] text-zinc-600",
  },

  // --- Export options form ---
  options: {
    wrapper: "flex flex-col gap-2 px-3 py-2 border-t border-white/[0.05]",
    title: "text-[9px] uppercase tracking-wider text-zinc-600 font-semibold",
    row: "flex items-center justify-between gap-2",
    label: "text-[10px] text-zinc-500",
    control: "flex-1",
    checkbox: "flex items-center gap-1.5",
    checkboxLabel: "text-[10px] text-zinc-400",
  },

  // --- Output path row ---
  pathRow: {
    wrapper: "flex items-center gap-1.5 px-3 py-1.5 border-t border-white/[0.05]",
    input: "flex-1 bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-[10px] font-mono text-zinc-400 focus:outline-none placeholder:text-zinc-700",
    browseButton: "px-2 py-1 rounded bg-white/[0.05] border border-white/[0.08] text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors shrink-0",
  },

  // --- Progress / status ---
  progress: {
    wrapper: "px-3 py-2 border-t border-white/[0.05]",
    bar: "w-full h-1 bg-white/[0.07] rounded-full overflow-hidden",
    fill: "h-full bg-orange-500 rounded-full transition-all",
    status: "flex items-center justify-between mt-1",
    label: "text-[10px] text-zinc-500",
    percent: "text-[10px] font-mono text-zinc-400 tabular-nums",
  },

  // --- Export action button ---
  exportButton:
    "mx-3 my-2 w-[calc(100%-1.5rem)] flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-violet-700 hover:bg-violet-600 text-white text-[10px] font-semibold transition-colors disabled:opacity-40",

  // --- Success state ---
  success: {
    wrapper: "flex flex-col items-center gap-2 px-3 py-4 text-center",
    icon: "w-7 h-7 text-emerald-400",
    message: "text-[10px] text-emerald-400 font-semibold",
    path: "text-[9px] font-mono text-zinc-600 break-all",
    openButton: "text-[10px] text-violet-400 hover:text-violet-300 underline transition-colors",
  },
} as const;

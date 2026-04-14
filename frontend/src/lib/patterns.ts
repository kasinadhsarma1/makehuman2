export const patterns = {
  // Layout & Panels
  panel: {
    container: "flex flex-col h-full border-l border-white/[0.07] bg-[#0e0e0e]",
    titleBar: "px-3 py-2 border-b border-white/[0.07] bg-[#111] shrink-0",
    titleText: "text-[10px] font-semibold text-zinc-400 uppercase tracking-wider truncate",
    titleTextAlt: "text-xs font-semibold text-zinc-300", // used in ContextPanel titles
    content: "flex-1 overflow-y-auto p-3 flex flex-col gap-2",
  },
  
  // Typography
  text: {
    label: "text-[10px] uppercase tracking-widest text-zinc-600 font-semibold",
    muted: "text-xs text-zinc-500",
    mono: "text-[10px] font-mono",
    error: "text-[10px] text-red-400",
    success: "text-[10px] text-emerald-400",
  },

  // Form Controls
  input: {
    base: "w-full bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-[10px] font-mono text-zinc-300 focus:outline-none",
    searchWrapper: "relative",
    searchIcon: "absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600",
    searchInput: "w-full bg-white/[0.04] border border-white/[0.08] rounded pl-7 pr-2 py-1 text-[10px] font-mono text-zinc-300 focus:outline-none",
    select: "w-full bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none",
    range: "flex-1 accent-orange-500 h-1",
  },

  // Buttons
  button: {
    base: "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-semibold transition-colors disabled:opacity-40",
    primary: "bg-violet-700 hover:bg-violet-600 text-white text-[10px] font-semibold transition-colors disabled:opacity-40",
    secondary: "bg-white/[0.05] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.08] text-[10px] font-semibold transition-colors disabled:opacity-40",
    danger: "bg-red-900/30 hover:bg-red-800/50 border border-red-700/30 text-red-300 text-[10px] font-semibold transition-colors disabled:opacity-40",
    activeCategory: "bg-orange-600/80 text-white",
    inactiveCategory: "text-zinc-500 hover:bg-white/[0.07] hover:text-zinc-300",
    iconTiny: "w-4 h-4 rounded bg-white/[0.04] text-zinc-500 hover:text-zinc-200 flex items-center justify-center shrink-0",
    actionSmall: "flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-semibold transition-colors disabled:opacity-40",
  },

  // Lists & Grids
  grid: {
    base: "grid grid-cols-3 gap-1.5",
    item: "relative aspect-square rounded overflow-hidden border transition-all bg-white/[0.03]",
    itemActive: "border-orange-500/70 ring-1 ring-orange-500/30",
    itemHighlight: "border-violet-500/40",
    itemInactive: "border-white/[0.06] hover:border-white/[0.12]",
  },
} as const;

export default patterns;

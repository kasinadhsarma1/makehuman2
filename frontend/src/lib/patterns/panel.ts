/**
 * Panel patterns — left panel, right panel, context panel.
 *
 * Matches the component structure:
 *   layout/LeftPanel.tsx, layout/RightPanel.tsx, layout/ContextPanel.tsx
 *
 * Architecture mirrors ropods-website sectionPatterns (wrapper, container,
 * header, title) adapted for a dark desktop-app panel system.
 */

export const panelPatterns = {
  // --- Shared panel shell ---
  container: "flex flex-col h-full border-l border-white/[0.07] bg-[#0e0e0e]",
  containerLeft: "flex flex-col h-full border-r border-white/[0.07] bg-[#0e0e0e]",

  // Title bar at top of panel section
  titleBar: "px-3 py-2 border-b border-white/[0.07] bg-[#111] shrink-0 flex items-center justify-between",
  titleText: "text-[10px] font-semibold text-zinc-400 uppercase tracking-wider truncate",
  titleTextAlt: "text-xs font-semibold text-zinc-300",

  // Scrollable body
  content: "flex-1 overflow-y-auto p-3 flex flex-col gap-2",
  contentNoPad: "flex-1 overflow-y-auto flex flex-col",

  // --- Left panel specifics ---
  left: {
    wrapper: "flex flex-col h-full w-full bg-[#0e0e0e] border-r border-white/[0.07]",
    categoryBar: "flex flex-col gap-0.5 px-1.5 py-2 border-b border-white/[0.06] shrink-0",
    categoryButton: "flex items-center gap-2 px-2 py-1.5 rounded text-[10px] font-semibold w-full text-left transition-colors",
    categoryActive: "bg-orange-600/80 text-white",
    categoryInactive: "text-zinc-500 hover:bg-white/[0.07] hover:text-zinc-300",
    treeList: "flex-1 overflow-y-auto px-1.5 py-1",
    treeItem: "flex items-center gap-1.5 px-2 py-1 rounded text-[10px] text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200 cursor-pointer transition-colors group",
    treeItemActive: "bg-orange-600/10 text-orange-300 border border-orange-500/20",
    treeItemIcon: "w-3 h-3 shrink-0 text-zinc-600 group-hover:text-zinc-400",
    // Connection mini-panel docked at bottom of left panel
    connectionBar: "border-t border-white/[0.07] p-2 flex flex-col gap-1.5 bg-[#111] shrink-0",
  },

  // --- Right panel specifics ---
  right: {
    wrapper: "flex flex-col h-full w-full bg-[#0e0e0e] border-l border-white/[0.07]",
    tabBar: "flex border-b border-white/[0.07] shrink-0",
    tab: "flex-1 px-2 py-2 text-[10px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors text-center border-r border-white/[0.06] last:border-r-0",
    tabActive: "text-zinc-200 border-b-2 border-orange-500",
    section: "px-3 py-2 border-b border-white/[0.05]",
    sectionTitle: "text-[9px] uppercase tracking-widest text-zinc-600 font-semibold mb-1.5",
    // Navigation / toggle button (view presets, toggleable overlays)
    navButton: "w-8 h-8 rounded flex items-center justify-center transition-colors text-xs border bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 border-white/[0.06] active:bg-white/[0.12]",
    navButtonActive: "w-8 h-8 rounded flex items-center justify-center transition-colors text-xs border bg-orange-600/70 text-white border-orange-500/50",
  },

  // --- Context panel specifics ---
  context: {
    wrapper: "flex flex-col bg-[#0a0a0a] border-t border-white/[0.07] shrink-0",
    titleBar: "px-3 py-1.5 border-b border-white/[0.06] bg-[#0e0e0e] flex items-center justify-between",
    title: "text-xs font-semibold text-zinc-300",
    body: "p-3 grid grid-cols-2 gap-x-4 gap-y-2",
    propertyRow: "flex items-center justify-between gap-2",
    propertyLabel: "text-[10px] text-zinc-600 shrink-0",
    propertyValue: "text-[10px] font-mono text-zinc-300 text-right truncate",
  },

  // Title bar shared helper — simple single-line title strip inside a panel section
  panelTitleBar: "px-3 py-2 border-b border-white/[0.07] bg-[#0e0e0e] shrink-0",

  // --- Empty / placeholder states ---
  empty: {
    wrapper: "flex flex-col items-center justify-center flex-1 p-4 text-center",
    icon: "w-8 h-8 text-zinc-700 mb-2",
    text: "text-[10px] text-zinc-600",
  },
} as const;

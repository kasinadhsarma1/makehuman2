/**
 * Asset grid & equipment panel patterns.
 *
 * Covers:  panels/EquipmentPanel.tsx
 *
 * Grid structure mirrors ropods-store searchPatterns.results.grid and
 * ropods-store productsPatterns.card, adapted for dark thumbnail grids.
 */

export const assetPatterns = {
  // --- Thumbnail grid ---
  grid: {
    base: "grid grid-cols-3 gap-1.5 p-3",
    gridTight: "grid grid-cols-4 gap-1",

    // Individual grid cell
    item: {
      base: "relative aspect-square rounded overflow-hidden border transition-all bg-white/[0.03] group cursor-pointer",
      active: "border-orange-500/70 ring-1 ring-orange-500/30",
      highlight: "border-violet-500/40",
      inactive: "border-white/[0.06] hover:border-white/[0.12]",
    },

    // Image / thumbnail inside cell
    image: "w-full h-full object-cover",
    imagePlaceholder:
      "w-full h-full flex items-center justify-center bg-white/[0.02] text-zinc-700",

    // Active indicator overlay
    activeOverlay:
      "absolute inset-0 border-2 border-orange-500/70 rounded pointer-events-none",
    checkmark:
      "absolute top-0.5 right-0.5 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center",

    // Cell label (shown on hover)
    label:
      "absolute bottom-0 left-0 right-0 px-1 py-0.5 bg-black/70 text-[9px] text-zinc-300 truncate opacity-0 group-hover:opacity-100 transition-opacity",
  },

  // --- List view (alternative to grid) ---
  list: {
    wrapper: "flex flex-col divide-y divide-white/[0.04]",
    item: "flex items-center gap-2.5 px-3 py-1.5 hover:bg-white/[0.03] cursor-pointer transition-colors group",
    itemActive: "bg-orange-600/10 border-l-2 border-orange-500",
    thumb: "w-8 h-8 rounded bg-white/[0.04] overflow-hidden shrink-0 object-cover",
    thumbPlaceholder: "w-8 h-8 rounded bg-white/[0.04] flex items-center justify-center text-zinc-700 shrink-0",
    name: "flex-1 text-[10px] text-zinc-400 group-hover:text-zinc-200 truncate transition-colors",
    badge: "text-[9px] px-1.5 py-0.5 rounded bg-white/[0.05] text-zinc-600 shrink-0",
    actions: "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
    actionButton: "w-4 h-4 rounded text-zinc-600 hover:text-zinc-200 flex items-center justify-center transition-colors",
  },

  // --- Equipment slot row (for single-slot items: eyes, hair, etc.) ---
  slot: {
    row: "flex items-center gap-2 px-3 py-1.5 border-b border-white/[0.04]",
    slotLabel: "text-[9px] uppercase tracking-wider text-zinc-600 w-16 shrink-0",
    thumb: "w-7 h-7 rounded bg-white/[0.04] overflow-hidden shrink-0",
    name: "flex-1 text-[10px] text-zinc-400 truncate",
    clearButton: "w-4 h-4 text-zinc-700 hover:text-red-400 transition-colors shrink-0",
    addButton: "w-4 h-4 rounded bg-white/[0.04] text-zinc-600 hover:text-zinc-200 flex items-center justify-center shrink-0 transition-colors",
  },

  // --- Filter / search bar (mirrors ropods-store searchPatterns.filterBar) ---
  filterBar: {
    wrapper: "flex items-center gap-1.5 px-3 py-1.5 border-b border-white/[0.05] shrink-0",
    input: "flex-1 bg-white/[0.04] border border-white/[0.08] rounded px-2 py-0.5 text-[10px] text-zinc-300 focus:outline-none placeholder:text-zinc-600",
    typeFilter: "text-[9px] px-1.5 py-0.5 rounded bg-white/[0.05] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer",
    typeFilterActive: "bg-violet-700/30 text-violet-300 border border-violet-700/30",
  },

  // --- Loading / empty states ---
  loading: {
    wrapper: "flex flex-col items-center justify-center flex-1 p-6",
    spinner: "w-5 h-5 border border-zinc-600 border-t-zinc-300 rounded-full animate-spin mb-2",
    text: "text-[10px] text-zinc-600",
  },
  empty: {
    wrapper: "flex flex-col items-center justify-center flex-1 p-6 text-center",
    icon: "w-8 h-8 text-zinc-700 mb-2",
    title: "text-[10px] font-semibold text-zinc-600 mb-1",
    description: "text-[9px] text-zinc-700",
  },
} as const;

/**
 * Modelling panel patterns — morph sliders, macro controls, modifier lists.
 *
 * Covers:  panels/ModellingPanels.tsx
 *
 * Nested object style mirrors ropods-store productsPatterns (card.details,
 * card.footer, card.button) applied to the morph-target slider system.
 */

export const modellingPatterns = {
  // --- Slider row (label + range + value readout) ---
  slider: {
    row: "flex flex-col gap-0.5",
    header: "flex items-center justify-between",
    label: "text-[10px] text-zinc-500 truncate max-w-[120px]",
    value: "text-[10px] font-mono text-zinc-400 tabular-nums shrink-0",
    track: "w-full accent-orange-500 h-1 cursor-pointer",
    trackWrapper: "flex items-center gap-1.5",
    resetButton:
      "w-3.5 h-3.5 rounded text-zinc-700 hover:text-zinc-400 flex items-center justify-center shrink-0 transition-colors",
  },

  // --- Macro sliders (Gender / Age / etc.) ---
  macro: {
    section: "flex flex-col gap-2.5 px-3 py-2.5 border-b border-white/[0.05]",
    title: "text-[9px] uppercase tracking-widest text-zinc-600 font-semibold mb-1",
    sliderRow: "flex flex-col gap-0.5",
    labelRow: "flex items-center justify-between",
    labelLeft: "text-[10px] text-zinc-600",
    labelRight: "text-[10px] text-zinc-600",
    valueCenter: "text-[10px] font-mono text-zinc-400 text-center tabular-nums",
    track: "w-full accent-violet-500 h-1 cursor-pointer",
  },

  // --- Category pill row ---
  categoryBar: {
    wrapper: "flex flex-wrap gap-1 px-3 py-1.5 border-b border-white/[0.05] shrink-0",
    pill: "px-2 py-0.5 rounded-full text-[9px] font-semibold cursor-pointer transition-colors",
    pillActive: "bg-orange-600/80 text-white",
    pillInactive: "bg-white/[0.04] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.07]",
  },

  // --- Search / filter bar ---
  filterBar: {
    wrapper: "flex items-center gap-1.5 px-3 py-1.5 border-b border-white/[0.05] shrink-0",
    input: "flex-1 bg-white/[0.04] border border-white/[0.08] rounded px-2 py-0.5 text-[10px] font-mono text-zinc-300 focus:outline-none placeholder:text-zinc-600",
    clearButton: "w-4 h-4 text-zinc-600 hover:text-zinc-300 transition-colors",
    modifiedBadge: "text-[9px] px-1.5 py-0.5 rounded-full bg-orange-600/20 text-orange-400 border border-orange-500/20 shrink-0",
  },

  // --- Modifier group separator ---
  group: {
    header: "flex items-center gap-1.5 px-3 py-1 sticky top-0 bg-[#0e0e0e] border-b border-white/[0.04] z-10",
    title: "text-[9px] uppercase tracking-widest text-zinc-600 font-semibold",
    count: "text-[9px] text-zinc-700 ml-auto",
  },

  // --- Body (scrollable modifier list) ---
  list: {
    wrapper: "flex-1 overflow-y-auto",
    section: "px-3 py-2 flex flex-col gap-2",
  },

  // --- Barycentric / blend sliders (3-way) ---
  blend: {
    wrapper: "flex flex-col gap-1 px-3 py-2",
    label: "text-[10px] text-zinc-500",
    triangleHint: "text-[9px] text-zinc-700 italic",
  },
} as const;

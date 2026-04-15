/**
 * Form controls — inputs, sliders, selects, checkboxes.
 *
 * Nested structure mirrors ropods-store patterns (e.g. input.field,
 * input.wrapper) while keeping the dark Electron-app aesthetic.
 */

export const controlPatterns = {
  // --- Text / search input ---
  input: {
    base: "w-full bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-[10px] font-mono text-zinc-300 focus:outline-none focus:border-white/[0.18] transition-colors",
    focused: "border-white/[0.18]",

    // Search variant (with icon slot)
    searchWrapper: "relative",
    searchIcon: "absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600",
    searchInput:
      "w-full bg-white/[0.04] border border-white/[0.08] rounded pl-7 pr-2 py-1 text-[10px] font-mono text-zinc-300 focus:outline-none focus:border-white/[0.18] transition-colors placeholder:text-zinc-600",

    // Inline label (floated label like ropods-store search)
    label: "absolute -top-2 left-2 bg-[#0e0e0e] px-1 text-[9px] text-zinc-600 uppercase tracking-wider",
  },

  // --- Select / dropdown ---
  select: {
    base: "w-full bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-white/[0.18] transition-colors appearance-none cursor-pointer",
    wrapper: "relative",
    chevron: "absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none",
  },

  // --- Range slider ---
  range: {
    base: "flex-1 accent-orange-500 h-1 cursor-pointer",
    wrapper: "flex items-center gap-2",
    label: "text-[10px] font-mono text-zinc-500 w-6 text-right shrink-0 tabular-nums",
  },

  // --- Checkbox / toggle ---
  checkbox: {
    base: "w-3 h-3 rounded-sm accent-orange-500 cursor-pointer",
    label: "text-[10px] text-zinc-400 select-none cursor-pointer",
    row: "flex items-center gap-1.5",
  },

  // --- Number stepper ---
  stepper: {
    wrapper: "flex items-center gap-1",
    button: "w-4 h-4 rounded bg-white/[0.04] border border-white/[0.07] text-zinc-400 hover:text-zinc-200 flex items-center justify-center text-[9px] transition-colors",
    value: "w-10 text-center text-[10px] font-mono text-zinc-300 bg-white/[0.04] border border-white/[0.08] rounded py-0.5",
  },
} as const;

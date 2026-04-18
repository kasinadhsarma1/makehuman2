/**
 * Typography patterns — text styles for the MakeHuman2 dark-theme UI.
 *
 * Architecture mirrors ropods-website / ropods-store pattern split:
 * each concern lives in its own file and is re-exported from index.ts.
 */

export const typographyPatterns = {
  // Micro labels (section headers, slider labels)
  label: "text-[10px] uppercase tracking-widest text-zinc-600 font-semibold",

  // Supporting / helper text
  muted: "text-xs text-zinc-500",

  // Italic placeholder / hint text (empty states, helper messages)
  hint: "text-[10px] text-zinc-600 italic text-center",

  // Small descriptive text (not italic, slightly brighter)
  infoText: "text-[10px] text-zinc-500 leading-relaxed",

  // Tiny uppercase section label (mimics `label` but no tracking)
  sectionLabel: "text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-1",

  // Monospace readout (values, coordinates)
  mono: "text-[10px] font-mono text-zinc-400",

  // Inline value display next to a slider
  value: "text-[10px] font-mono text-zinc-300 tabular-nums",

  // Panel section title
  sectionTitle: "text-[11px] font-semibold text-zinc-300 uppercase tracking-wider",

  // Context panel / property title
  panelTitle: "text-xs font-semibold text-zinc-300",

  // Small status text
  error: "text-[10px] text-red-400",
  success: "text-[10px] text-emerald-400",
  warning: "text-[10px] text-amber-400",

  // Larger headings (used in dialogs / overlays)
  heading: {
    sm: "text-sm font-semibold text-zinc-200",
    md: "text-base font-semibold text-zinc-100",
    lg: "text-lg font-bold text-white",
  },
} as const;

/**
 * Viewport & render panel patterns.
 *
 * Covers:  layout/Viewport.tsx  and  panels/RenderPanel.tsx
 */

export const viewportPatterns = {
  // --- 3D viewport container ---
  container: "relative flex-1 bg-[#1a1a1a] overflow-hidden",
  canvas: "w-full h-full block",

  // --- Overlay HUD elements ---
  hud: {
    wrapper: "absolute inset-0 pointer-events-none",
    topLeft: "absolute top-2 left-2 flex flex-col gap-1 pointer-events-auto",
    topRight: "absolute top-2 right-2 flex flex-col gap-1 pointer-events-auto",
    bottomLeft: "absolute bottom-2 left-2 flex flex-col gap-1 pointer-events-auto",
    bottomRight: "absolute bottom-2 right-2 flex flex-col gap-1 pointer-events-auto",
    badge:
      "px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-zinc-400 backdrop-blur-sm",
  },

  // --- View controls (top-right corner) ---
  viewControls: {
    wrapper: "flex flex-col gap-0.5",
    button:
      "w-6 h-6 rounded bg-black/50 backdrop-blur-sm text-zinc-500 hover:text-zinc-200 flex items-center justify-center transition-colors",
    buttonActive: "bg-orange-600/40 text-orange-300",
    icon: "w-3.5 h-3.5",
  },

  // --- Render progress overlay ---
  renderOverlay: {
    wrapper: "absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm z-20",
    title: "text-sm font-semibold text-zinc-200 mb-2",
    progressBar: "w-48 h-1 bg-white/[0.1] rounded-full overflow-hidden",
    progressFill: "h-full bg-orange-500 rounded-full transition-all",
    label: "text-[10px] text-zinc-500 mt-1 tabular-nums",
    cancelButton: "mt-3 px-3 py-1 rounded bg-white/[0.07] text-zinc-400 hover:text-zinc-200 text-[10px] transition-colors",
  },

  // --- Render panel (settings sidebar) ---
  render: {
    section: "px-3 py-2 border-b border-white/[0.05]",
    sectionTitle: "text-[9px] uppercase tracking-wider text-zinc-600 font-semibold mb-1.5",
    row: "flex items-center justify-between gap-2 mb-1",
    label: "text-[10px] text-zinc-500 shrink-0",
    control: "flex-1",
    previewThumb: "w-full aspect-video rounded bg-white/[0.04] overflow-hidden",
    renderButton:
      "w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-violet-700 hover:bg-violet-600 text-white text-[10px] font-semibold transition-colors mt-2",
  },
} as const;

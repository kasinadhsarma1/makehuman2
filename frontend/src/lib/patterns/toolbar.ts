/**
 * Toolbar & MenuBar patterns.
 *
 * Covers:  layout/Toolbar.tsx  and  layout/MenuBar.tsx
 *
 * Mirrors ropods-website navbarPatterns structure (nav, container,
 * button.primary, button.mobile, etc.) adapted for Electron's
 * compact dark chrome.
 */

export const toolbarPatterns = {
  // --- Main toolbar bar ---
  bar: "flex items-center gap-1 px-2 py-1 bg-[#111] border-b border-white/[0.06] shrink-0 h-9",
  separator: "w-px h-4 bg-white/[0.08] mx-0.5",
  spacer: "flex-1",

  // Tool button group
  group: "flex items-center gap-0.5",

  // Individual toolbar button
  button: {
    base: "flex items-center justify-center w-6 h-6 rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.07] transition-colors",
    active: "bg-orange-600/20 text-orange-300 hover:bg-orange-600/30",
    icon: "w-3.5 h-3.5",
  },

  // Camera / view preset buttons
  viewPreset: {
    wrapper: "flex items-center gap-0.5 ml-1",
    button: "px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors",
    active: "bg-white/[0.08] text-zinc-300",
  },

  // Render mode switcher (Phong / PBR / Toon)
  modeSwitch: {
    wrapper: "flex items-center gap-0.5",
    button: "px-2 py-0.5 rounded text-[9px] font-semibold text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors",
    active: "bg-violet-700/40 text-violet-300 border border-violet-700/40",
  },
} as const;

// --- MenuBar (application menu row above toolbar) ---
export const menuBarPatterns = {
  bar: "flex items-center h-7 px-2 bg-[#0c0c0c] border-b border-white/[0.05] shrink-0 select-none",
  logo: "text-[10px] font-bold text-zinc-200 tracking-widest mr-3 shrink-0",

  // Top-level menu item
  menuItem: {
    trigger: "px-2.5 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.07] rounded transition-colors cursor-default",
    triggerOpen: "bg-white/[0.09] text-zinc-200",
  },

  // Dropdown panel
  dropdown: {
    panel: "absolute top-full left-0 mt-0.5 min-w-[160px] bg-[#1a1a1a] border border-white/[0.09] rounded shadow-xl z-50 py-1",
    item: "flex items-center justify-between px-3 py-1 text-[10px] text-zinc-300 hover:bg-white/[0.07] hover:text-zinc-100 cursor-default transition-colors",
    itemIcon: "w-3 h-3 mr-2 text-zinc-600",
    itemShortcut: "text-[9px] text-zinc-600 ml-4",
    separator: "my-1 border-t border-white/[0.06]",
    sectionLabel: "px-3 py-0.5 text-[9px] text-zinc-600 uppercase tracking-wider",
    itemDanger: "text-red-400 hover:bg-red-900/20",
  },

  // Window title (centre of menu bar)
  title: "flex-1 text-center text-[10px] text-zinc-600 truncate pointer-events-none",
} as const;

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

  // --- Toggle icon button (w-8 h-8, used in RightPanel NavButton & ModellingPanels ModelButtons) ---
  iconToggle: {
    base: "w-8 h-8 rounded flex items-center justify-center transition-colors text-xs border bg-white/[0.04] border-white/[0.06] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200",
    active: "w-8 h-8 rounded flex items-center justify-center transition-colors text-xs border bg-orange-600/70 border-orange-500/50 text-white",
  },

  // --- Playback / transport button (flex-1, used in AnimPlayerPanel) ---
  transport:
    "flex-1 h-8 rounded flex items-center justify-center bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 transition-colors disabled:opacity-30",

  // --- Full-width action button (forms, export, render etc.) ---
  fullPrimary:
    "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold transition-colors disabled:opacity-40",
  fullPrimaryLg:
    "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold transition-colors disabled:opacity-40",

  // --- Asset list item buttons (Use, Remove, Info at bottom of panel) ---
  assetUse:
    "flex items-center gap-1.5 px-3 py-1.5 rounded bg-violet-700 hover:bg-violet-600 border border-violet-600 text-white text-xs font-semibold transition-colors disabled:opacity-40",
  assetRemove:
    "flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-900/30 hover:bg-red-800/50 border border-red-700/30 text-red-300 text-xs font-semibold transition-colors disabled:opacity-40",
  assetInfo:
    "flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/[0.05] border border-white/[0.08] text-zinc-300 text-xs font-semibold transition-colors disabled:opacity-40",

  // --- Full-width secondary (Load rig / pose / expression) ---
  loadAction:
    "flex items-center gap-2 px-3 py-2 rounded bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold transition-colors disabled:opacity-40",

  // --- Form action variants ---
  formDefault:
    "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-zinc-300 disabled:opacity-40",
  formPrimary:
    "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors bg-violet-700 hover:bg-violet-600 border border-violet-600 text-white disabled:opacity-40",
  formDanger:
    "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors bg-red-900/30 hover:bg-red-800/50 border border-red-700/30 text-red-300 disabled:opacity-40",

  // --- Checkbox toggle row (used in FilesPanels, ModellingPanels, PosePanels) ---
  checkboxRow:
    "flex items-center gap-2 text-xs text-zinc-300 hover:text-white transition-colors py-0.5",

  // --- Small icon button (w-5 h-5 variant used in PoseUnitSlider) ---
  iconSmall:
    "w-5 h-5 rounded bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-zinc-200 flex items-center justify-center shrink-0",

  // --- Asset list row toggle (thumbnail item in BaseMesh / asset pickers) ---
  listItem: {
    base: "w-full text-left px-3 py-2 text-sm transition-colors font-mono text-zinc-300 hover:bg-white/[0.05]",
    active: "bg-orange-600/70 text-white",
    mono: "w-full text-left px-3 py-1.5 text-xs font-mono transition-colors text-zinc-300 hover:bg-white/[0.04]",
    monoActive: "bg-orange-600/50 text-white",
  },

  // --- Toggle subdiviside / binary state button (full-width) ---
  toggleFull: {
    base: "w-full px-3 py-2 rounded text-xs font-semibold transition-colors border bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:bg-white/[0.08]",
    active: "w-full px-3 py-2 rounded text-xs font-semibold transition-colors border bg-orange-600/70 border-orange-500/50 text-white",
  },

  // --- Folder/select icon button beside a text input ---
  inputAddon:
    "px-2 py-1.5 rounded bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.09] transition-colors",

  // --- Loop / playback loop toggle ---
  loopActive: "flex-1 h-8 rounded flex items-center justify-center transition-colors border bg-orange-600/70 border-orange-500/50 text-white",
  loopInactive: "flex-1 h-8 rounded flex items-center justify-center transition-colors border bg-white/[0.04] border-white/[0.06] text-zinc-400 hover:bg-white/[0.08]",

  // --- Reset icon button (single icon, square, used in PoseEditorPanel) ---
  iconReset:
    "w-8 h-8 rounded bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:bg-white/[0.08] flex items-center justify-center transition-colors",

  // --- Full-width flex-1 action pair (Save / Load Expression/Pose) ---
  flexPrimary:
    "flex-1 px-3 py-1.5 rounded bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold transition-colors",
  flexSecondary:
    "flex-1 px-3 py-1.5 rounded bg-white/[0.05] border border-white/[0.08] text-zinc-300 text-xs font-semibold transition-colors hover:bg-white/[0.09]",

  // --- Category group tree row (toggle + sub items) in ModellingPanels / PosePanels ---
  treeGroupRow:
    "w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded hover:bg-white/[0.05] transition-colors",
  treeItemBase:
    "w-full text-left px-6 py-1 text-xs transition-colors text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200",
  treeItemActive: "bg-orange-600/60 text-white",
  treeItemActivePose: "bg-orange-600/50 text-white",

  // --- Randomize groups multi-select row ---
  groupRow: {
    base: "w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors text-zinc-500 hover:bg-white/[0.03]",
    active: "bg-orange-600/30 text-orange-200",
  },

  // --- Refresh icon button (beside filter input) ---
  refreshAddon:
    "px-2 py-1.5 rounded bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors",

  // --- Equipment item list row ---
  equipItem: {
    base: "w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors text-zinc-300 hover:bg-white/[0.04]",
    selected: "bg-orange-600/50 text-white",
    equipped: "bg-violet-900/30 text-violet-200 hover:bg-violet-900/40",
  },

  // --- Equipment equipped badge ---
  equippedBadge:
    "text-[9px] bg-violet-700/50 text-violet-300 px-1.5 py-0.5 rounded-full shrink-0",
} as const;

/**
 * Skeleton / pose editor patterns.
 *
 * Covers:  panels/PosePanels.tsx
 *
 * Nested structure mirrors ropods-store orderTimelinePatterns adapted
 * for a hierarchical bone-tree and pose-frame scrubber UI.
 */

export const skeletonPatterns = {
  // --- Bone tree ---
  boneTree: {
    wrapper: "flex-1 overflow-y-auto",
    row: "flex items-center gap-1 px-2 py-0.5 hover:bg-white/[0.03] cursor-pointer transition-colors group",
    rowActive: "bg-orange-600/10 text-orange-300",
    indent: "w-3 shrink-0",            // multiply by bone.level
    toggleIcon: "w-3 h-3 text-zinc-700 shrink-0",
    boneIcon: "w-3 h-3 text-zinc-600 group-hover:text-zinc-400 shrink-0",
    boneName: "text-[10px] text-zinc-400 group-hover:text-zinc-200 truncate flex-1",
    boneNameActive: "text-[10px] text-orange-300 font-semibold",
    overrideBadge: "text-[9px] px-1 py-0.5 rounded-sm bg-violet-700/30 text-violet-400 border border-violet-700/30 ml-auto shrink-0",
  },

  // --- Pose list ---
  poseList: {
    wrapper: "flex flex-col divide-y divide-white/[0.04]",
    item: "flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.03] cursor-pointer transition-colors group",
    itemActive: "bg-orange-600/10 border-l-2 border-orange-500",
    icon: "w-5 h-5 rounded bg-white/[0.04] flex items-center justify-center text-zinc-600 shrink-0",
    name: "flex-1 text-[10px] text-zinc-400 group-hover:text-zinc-200 truncate",
    duration: "text-[9px] text-zinc-600 tabular-nums shrink-0",
  },

  // --- Animation scrubber ---
  scrubber: {
    wrapper: "px-3 py-2 border-t border-white/[0.06]",
    controls: "flex items-center gap-1.5 mb-1.5",
    playButton: "w-6 h-6 rounded bg-white/[0.05] text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors",
    playButtonActive: "bg-orange-600/30 text-orange-300",
    frameCounter: "text-[9px] font-mono text-zinc-600 tabular-nums",
    timeline: "w-full h-1 accent-orange-500 cursor-pointer",
    timelineWrapper: "flex items-center gap-1",
    timeLabel: "text-[9px] font-mono text-zinc-700 w-8 text-right tabular-nums",
  },

  // --- Bone rotation override (euler inputs) ---
  boneOverride: {
    wrapper: "px-3 py-2 border-t border-white/[0.06]",
    title: "text-[9px] uppercase tracking-wider text-zinc-600 mb-1.5",
    axisRow: "flex items-center gap-1 mb-1",
    axisLabel: "text-[10px] font-mono text-zinc-600 w-3 shrink-0",
    axisInput: "flex-1 bg-white/[0.04] border border-white/[0.08] rounded px-1.5 py-0.5 text-[10px] font-mono text-zinc-300 focus:outline-none",
    resetButton: "text-[9px] text-zinc-600 hover:text-red-400 transition-colors ml-auto",
  },

  // --- Rig selector ---
  rigSelector: {
    wrapper: "px-3 py-2 border-b border-white/[0.05] shrink-0",
    label: "text-[9px] uppercase tracking-wider text-zinc-600 mb-1",
    select: "w-full bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-[10px] text-zinc-300 focus:outline-none appearance-none",
  },
} as const;

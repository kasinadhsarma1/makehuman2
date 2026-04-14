"use client";

import patterns from "@/lib/patterns";
import { FolderOpen, Sliders, Shirt, PersonStanding, Camera } from "lucide-react";

export type ToolMode = 0 | 1 | 2 | 3 | 4;

const TOOLS: { icon: React.ReactNode; tip: string }[] = [
  { icon: <FolderOpen className="w-5 h-5" />, tip: "Files" },
  { icon: <Sliders className="w-5 h-5" />, tip: "Modelling – Change character" },
  { icon: <Shirt className="w-5 h-5" />, tip: "Equipment" },
  { icon: <PersonStanding className="w-5 h-5" />, tip: "Pose" },
  { icon: <Camera className="w-5 h-5" />, tip: "Render" },
];

export function Toolbar({
  toolMode,
  setToolMode,
  disabled = false,
}: {
  toolMode: ToolMode;
  setToolMode: (m: ToolMode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-[#111] border-b border-white/[0.07] shrink-0">
      {TOOLS.map((t, i) => (
        <button
          key={i}
          onClick={() => !disabled && setToolMode(i as ToolMode)}
          title={t.tip}
          className={`w-9 h-9 rounded flex items-center justify-center transition-colors ${
            toolMode === i
              ? "${patterns.button.activeCategory}"
              : "text-zinc-400 hover:bg-white/[0.07] hover:text-zinc-200"
          } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}

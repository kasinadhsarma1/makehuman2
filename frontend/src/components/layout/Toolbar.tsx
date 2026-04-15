"use client";

import { toolbarPatterns } from "@/lib/patterns";
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
    <div className={toolbarPatterns.bar}>
      <div className={toolbarPatterns.group}>
        {TOOLS.map((t, i) => (
          <button
            key={i}
            onClick={() => !disabled && setToolMode(i as ToolMode)}
            title={t.tip}
            className={`w-9 h-9 rounded flex items-center justify-center transition-colors ${
              toolMode === i
                ? toolbarPatterns.button.active
                : toolbarPatterns.button.base
            } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            {t.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

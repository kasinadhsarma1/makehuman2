"use client";

/**
 * Right navigation panel – mirrors MHGraphicWindow.navButtons()
 * Grid layout:
 *   Row 0: [_,   Top,  _,    _  ]
 *   Row 1: [Left,Front,Right,Back]
 *   Row 2: [_,  Bottom,_,   _   ]
 *   Row 3: [Axes,XYGrid,YZGrid,Floor]
 *   Row 4: [Unhide,Skeleton,Wireframe,Ghost]
 *   Row 5: [Persp,Skybox,Recalc,Camera]
 * Then: Floor combo + Focal slider
 */

import patterns from "@/lib/patterns";
import {
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Grid2x2,
  Bone,
  Grid3x3,
  Ghost,
  Box,
  Sun,
  RefreshCw,
  Camera,
  Axis3d,
  Layers,
} from "lucide-react";

export interface ViewState {
  perspective: boolean;
  skybox: boolean;
  showAxes: boolean;
  showXYGrid: boolean;
  showYZGrid: boolean;
  showFloorGrid: boolean;
  unhideVerts: boolean;
  showSkeleton: boolean;
  showWireframe: boolean;
  showGhost: boolean;
  floorMode: number;
  focalLength: number;
}

export const DEFAULT_VIEW_STATE: ViewState = {
  perspective: true,
  skybox: true,
  showAxes: false,
  showXYGrid: false,
  showYZGrid: false,
  showFloorGrid: true,
  unhideVerts: false,
  showSkeleton: false,
  showWireframe: false,
  showGhost: false,
  floorMode: 0,
  focalLength: 50,
};

interface NavBtn {
  icon: React.ReactNode;
  tip: string;
  row: number;
  col: number;
  checkable?: boolean;
  stateKey?: keyof ViewState;
  action?: () => void;
}

function NavButton({
  icon,
  tip,
  checked,
  checkable,
  onClick,
}: {
  icon: React.ReactNode;
  tip: string;
  checked?: boolean;
  checkable?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      title={tip}
      onClick={onClick}
      className={`w-8 h-8 rounded flex items-center justify-center transition-colors text-xs ${checkable
          ? checked
            ? "bg-orange-600/70 text-white border border-orange-500/50"
            : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 border border-white/[0.06]"
          : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 border border-white/[0.06] active:bg-white/[0.12]"
        }`}
    >
      {icon}
    </button>
  );
}

export function RightPanel({
  viewState,
  onViewChange,
  onCameraAction,
  onRecalc,
  disabled = false,
}: {
  viewState: ViewState;
  onViewChange: (patch: Partial<ViewState>) => void;
  onCameraAction: (action: "top" | "bottom" | "left" | "right" | "front" | "back") => void;
  onRecalc: () => void;
  disabled?: boolean;
}) {
  const toggle = (key: keyof ViewState) => {
    onViewChange({ [key]: !viewState[key] });
  };

  // 4-col grid: we build cells row-by-row, sparse (null = empty)
  // [row][col]
  const grid: (React.ReactNode | null)[][] = Array.from({ length: 6 }, () =>
    Array(4).fill(null)
  );

  // Row 0: top view at col 1
  grid[0][1] = (
    <NavButton
      icon={<ChevronUp className="w-4 h-4" />}
      tip="Top view"
      onClick={() => !disabled && onCameraAction("top")}
    />
  );
  // Row 1
  grid[1][0] = (
    <NavButton
      icon={<ChevronLeft className="w-4 h-4" />}
      tip="Left view"
      onClick={() => !disabled && onCameraAction("left")}
    />
  );
  grid[1][1] = (
    <NavButton
      icon={<Eye className="w-4 h-4" />}
      tip="Front view"
      onClick={() => !disabled && onCameraAction("front")}
    />
  );
  grid[1][2] = (
    <NavButton
      icon={<ChevronRight className="w-4 h-4" />}
      tip="Right view"
      onClick={() => !disabled && onCameraAction("right")}
    />
  );
  grid[1][3] = (
    <NavButton
      icon={<EyeOff className="w-4 h-4" />}
      tip="Back view"
      onClick={() => !disabled && onCameraAction("back")}
    />
  );
  // Row 2: bottom at col 1
  grid[2][1] = (
    <NavButton
      icon={<ChevronDown className="w-4 h-4" />}
      tip="Bottom view"
      onClick={() => !disabled && onCameraAction("bottom")}
    />
  );
  // Row 3: grid toggles
  grid[3][0] = (
    <NavButton
      icon={<Axis3d className="w-4 h-4" />}
      tip="Axes"
      checkable
      checked={viewState.showAxes}
      onClick={() => !disabled && toggle("showAxes")}
    />
  );
  grid[3][1] = (
    <NavButton
      icon={<Grid2x2 className="w-4 h-4" />}
      tip="XY-Grid"
      checkable
      checked={viewState.showXYGrid}
      onClick={() => !disabled && toggle("showXYGrid")}
    />
  );
  grid[3][2] = (
    <NavButton
      icon={<Layers className="w-4 h-4" />}
      tip="YZ-Grid"
      checkable
      checked={viewState.showYZGrid}
      onClick={() => !disabled && toggle("showYZGrid")}
    />
  );
  grid[3][3] = (
    <NavButton
      icon={<Grid3x3 className="w-4 h-4" />}
      tip="Floor-Grid"
      checkable
      checked={viewState.showFloorGrid}
      onClick={() => !disabled && toggle("showFloorGrid")}
    />
  );
  // Row 4: visibility
  grid[4][0] = (
    <NavButton
      icon={<Eye className="w-4 h-4" />}
      tip="Do not delete vertices under clothes"
      checkable
      checked={viewState.unhideVerts}
      onClick={() => !disabled && toggle("unhideVerts")}
    />
  );
  grid[4][1] = (
    <NavButton
      icon={<Bone className="w-4 h-4" />}
      tip="Visualize skeleton"
      checkable
      checked={viewState.showSkeleton}
      onClick={() => !disabled && toggle("showSkeleton")}
    />
  );
  grid[4][2] = (
    <NavButton
      icon={<Grid3x3 className="w-4 h-4" />}
      tip="Visualize mesh (wireframe)"
      checkable
      checked={viewState.showWireframe}
      onClick={() => !disabled && toggle("showWireframe")}
    />
  );
  grid[4][3] = (
    <NavButton
      icon={<Ghost className="w-4 h-4" />}
      tip="Visualize hidden geometry"
      checkable
      checked={viewState.showGhost}
      onClick={() => !disabled && toggle("showGhost")}
    />
  );
  // Row 5: render options
  grid[5][0] = (
    <NavButton
      icon={<Box className="w-4 h-4" />}
      tip="Perspective"
      checkable
      checked={viewState.perspective}
      onClick={() => !disabled && toggle("perspective")}
    />
  );
  grid[5][1] = (
    <NavButton
      icon={<Sun className="w-4 h-4" />}
      tip="Skybox"
      checkable
      checked={viewState.skybox}
      onClick={() => !disabled && toggle("skybox")}
    />
  );
  grid[5][2] = (
    <NavButton
      icon={<RefreshCw className="w-4 h-4" />}
      tip="Recalculate normals and reload changed textures"
      onClick={() => !disabled && onRecalc()}
    />
  );
  grid[5][3] = (
    <NavButton
      icon={<Camera className="w-4 h-4" />}
      tip="Grab screen"
      onClick={() => { }}
    />
  );

  return (
    <div
      className={`w-40 shrink-0 border-l border-white/[0.07] bg-[#0e0e0e] flex flex-col p-2 gap-3 overflow-y-auto ${disabled ? "opacity-40 pointer-events-none" : ""
        }`}
    >
      {/* Navigation grid */}
      <div className="grid grid-cols-4 gap-1">
        {grid.flat().map((cell, i) => (
          <div key={i} className="flex items-center justify-center">
            {cell ?? <div className="w-8 h-8" />}
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.06]" />

      {/* Floor calculation */}
      <div className="flex flex-col gap-1">
        <span className={patterns.text.label}>
          Floor calc
        </span>
        <select
          value={viewState.floorMode}
          onChange={(e) => onViewChange({ floorMode: Number(e.target.value) })}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none"
        >
          <option value={0}>by lowest vertex</option>
          <option value={1}>origin</option>
        </select>
      </div>

      {/* Focal length */}
      <div className="flex flex-col gap-1">
        <span className={patterns.text.label}>
          Focal Length: {viewState.focalLength}
        </span>
        <input
          type="range"
          min={15}
          max={200}
          value={viewState.focalLength}
          onChange={(e) => onViewChange({ focalLength: Number(e.target.value) })}
          className="w-full accent-orange-500"
        />
      </div>
    </div>
  );
}

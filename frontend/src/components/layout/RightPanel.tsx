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

import { panelPatterns, controlPatterns, typographyPatterns } from "@/lib/patterns";
import {
  ChevronUp, ChevronLeft, ChevronRight, ChevronDown,
  Eye, EyeOff, Grid2x2, Bone, Grid3x3, Ghost,
  Box, Sun, RefreshCw, Camera, Axis3d, Layers,
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

function NavButton({
  icon, tip, checked, checkable, onClick,
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
      className={checkable && checked ? panelPatterns.right.navButtonActive : panelPatterns.right.navButton}
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
  const toggle = (key: keyof ViewState) => onViewChange({ [key]: !viewState[key] });

  const grid: (React.ReactNode | null)[][] = Array.from({ length: 6 }, () => Array(4).fill(null));

  grid[0][1] = <NavButton icon={<ChevronUp className="w-4 h-4" />}    tip="Top view"    onClick={() => !disabled && onCameraAction("top")} />;
  grid[1][0] = <NavButton icon={<ChevronLeft className="w-4 h-4" />}  tip="Left view"   onClick={() => !disabled && onCameraAction("left")} />;
  grid[1][1] = <NavButton icon={<Eye className="w-4 h-4" />}          tip="Front view"  onClick={() => !disabled && onCameraAction("front")} />;
  grid[1][2] = <NavButton icon={<ChevronRight className="w-4 h-4" />} tip="Right view"  onClick={() => !disabled && onCameraAction("right")} />;
  grid[1][3] = <NavButton icon={<EyeOff className="w-4 h-4" />}       tip="Back view"   onClick={() => !disabled && onCameraAction("back")} />;
  grid[2][1] = <NavButton icon={<ChevronDown className="w-4 h-4" />}  tip="Bottom view" onClick={() => !disabled && onCameraAction("bottom")} />;

  grid[3][0] = <NavButton icon={<Axis3d className="w-4 h-4" />}   tip="Axes"       checkable checked={viewState.showAxes}      onClick={() => !disabled && toggle("showAxes")} />;
  grid[3][1] = <NavButton icon={<Grid2x2 className="w-4 h-4" />}  tip="XY-Grid"    checkable checked={viewState.showXYGrid}    onClick={() => !disabled && toggle("showXYGrid")} />;
  grid[3][2] = <NavButton icon={<Layers className="w-4 h-4" />}   tip="YZ-Grid"    checkable checked={viewState.showYZGrid}    onClick={() => !disabled && toggle("showYZGrid")} />;
  grid[3][3] = <NavButton icon={<Grid3x3 className="w-4 h-4" />}  tip="Floor-Grid" checkable checked={viewState.showFloorGrid} onClick={() => !disabled && toggle("showFloorGrid")} />;

  grid[4][0] = <NavButton icon={<Eye className="w-4 h-4" />}      tip="Do not delete vertices under clothes" checkable checked={viewState.unhideVerts}    onClick={() => !disabled && toggle("unhideVerts")} />;
  grid[4][1] = <NavButton icon={<Bone className="w-4 h-4" />}     tip="Visualize skeleton"                   checkable checked={viewState.showSkeleton}   onClick={() => !disabled && toggle("showSkeleton")} />;
  grid[4][2] = <NavButton icon={<Grid3x3 className="w-4 h-4" />}  tip="Visualize mesh (wireframe)"           checkable checked={viewState.showWireframe}  onClick={() => !disabled && toggle("showWireframe")} />;
  grid[4][3] = <NavButton icon={<Ghost className="w-4 h-4" />}    tip="Visualize hidden geometry"            checkable checked={viewState.showGhost}      onClick={() => !disabled && toggle("showGhost")} />;

  grid[5][0] = <NavButton icon={<Box className="w-4 h-4" />}       tip="Perspective"                              checkable checked={viewState.perspective} onClick={() => !disabled && toggle("perspective")} />;
  grid[5][1] = <NavButton icon={<Sun className="w-4 h-4" />}       tip="Skybox"                                   checkable checked={viewState.skybox}      onClick={() => !disabled && toggle("skybox")} />;
  grid[5][2] = <NavButton icon={<RefreshCw className="w-4 h-4" />} tip="Recalculate normals and reload textures"  onClick={() => !disabled && onRecalc()} />;
  grid[5][3] = <NavButton icon={<Camera className="w-4 h-4" />}    tip="Grab screen"                              onClick={() => {}} />;

  return (
    <div
      className={`w-40 shrink-0 ${panelPatterns.container} flex flex-col p-2 gap-3 overflow-y-auto ${
        disabled ? "opacity-40 pointer-events-none" : ""
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
      <div className={panelPatterns.right.section}>
        <span className={panelPatterns.right.sectionTitle}>Floor calc</span>
        <select
          value={viewState.floorMode}
          onChange={(e) => onViewChange({ floorMode: Number(e.target.value) })}
          className={controlPatterns.select.base}
        >
          <option value={0}>by lowest vertex</option>
          <option value={1}>origin</option>
        </select>
      </div>

      {/* Focal length */}
      <div className={panelPatterns.right.section}>
        <span className={panelPatterns.right.sectionTitle}>
          Focal Length: <span className={typographyPatterns.value}>{viewState.focalLength}</span>
        </span>
        <div className={controlPatterns.range.wrapper}>
          <input
            type="range"
            min={15}
            max={200}
            value={viewState.focalLength}
            onChange={(e) => onViewChange({ focalLength: Number(e.target.value) })}
            className={controlPatterns.range.base}
          />
        </div>
      </div>
    </div>
  );
}

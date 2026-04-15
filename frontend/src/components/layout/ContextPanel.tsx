"use client";

/**
 * Right ToolBox / Context Panel – mirrors drawRightPanel() from MHMainWindow.
 * Visibility follows the same logic as the Python code:
 *   - Returns a visible panel for modes/categories that need it
 *   - Hidden for basemesh (0/0), download (0/5), random (1/1), anim player (3/2), render (4/x)
 *
 * Shows:
 *   Files/skin (0/1)          → Image grid:  base material / skins
 *   Files/load (0/2)          → Image grid:  character MHM files
 *   Files/save (0/3)          → Image grid:  character MHM files (read-only)
 *   Files/export (0/4)        → Export type + scale selector
 *   Modelling/categories(1/0) → Morph sliders (category filtered)
 *   Equipment/any (2/*)       → Equipment image grid
 *   Pose/rigs,poses,expr(3/0,1,3) → Animation image grid
 *   Pose/expr editor (3/4)    → Expression sliders (category)
 *   Pose/pose editor (3/5)    → Pose sliders (category)
 */

import {
  panelPatterns,
  typographyPatterns,
  buttonPatterns,
  controlPatterns,
  assetPatterns,
} from "@/lib/patterns";
import { useState } from "react";
import { Search, Plus, Trash2, Info, Download, Minus } from "lucide-react";
import type { ToolMode } from "./Toolbar";
import type { ExportFormData, ExportType } from "@/components/panels/FilesPanels";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-2 border-b border-white/[0.07] bg-[#0e0e0e] shrink-0">
      <p className={panelPatterns.titleTextAlt}>{children}</p>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className={typographyPatterns.label}>
      {children}
    </label>
  );
}

// ─── Image grid (thumbnails) ──────────────────────────────────────────────────

interface ImageItem {
  name: string;
  thumb?: string;
  active?: boolean;
}

function ImageGrid({
  items,
  selected,
  onSelect,
  onUse,
  onDelete,
  onInfo,
  onDownload,
  readOnly,
  buttonMask, // bit 0=use, bit 1=delete, bit 2=info, bit 3=download
}: {
  items: ImageItem[];
  selected: string;
  onSelect: (n: string) => void;
  onUse?: (n: string) => void;
  onDelete?: (n: string) => void;
  onInfo?: (n: string) => void;
  onDownload?: (n: string) => void;
  readOnly?: boolean;
  buttonMask?: number;
}) {
  const mask = buttonMask ?? 15;
  const showUse = !readOnly && !!(mask & 1);
  const showDelete = !readOnly && !!(mask & 2);
  const showInfo = !!(mask & 4);
  const showDownload = !!(mask & 8);

  return (
    <div className="flex flex-col h-full">
      {/* Thumbnail grid */}
      <div className="flex-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-24">
            <p className="text-xs text-zinc-600 italic text-center">
              Connect to core to browse assets.
            </p>
          </div>
        ) : (
          <div className={assetPatterns.grid.base}>
            {items.map((item) => (
              <button
                key={item.name}
                onClick={() => onSelect(item.name)}
                className={`relative aspect-square rounded overflow-hidden border transition-all ${selected === item.name
                  ? assetPatterns.grid.item.active
                  : item.active
                    ? assetPatterns.grid.item.highlight
                    : assetPatterns.grid.item.inactive
                  } bg-white/[0.03]`}
              >
                {item.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumb}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[8px] text-zinc-600 font-mono text-center px-1 leading-tight break-all">
                      {item.name}
                    </span>
                  </div>
                )}
                {item.active && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-violet-400" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {(showUse || showDelete || showInfo || showDownload) && (
        <div className="flex flex-wrap gap-1 p-2 border-t border-white/[0.07] shrink-0">
          {showUse && (
            <button
              onClick={() => selected && onUse?.(selected)}
              disabled={!selected}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded ${buttonPatterns.primary}`}
            >
              <Plus className="w-3 h-3" />
              Use
            </button>
          )}
          {showDelete && (
            <button
              onClick={() => selected && onDelete?.(selected)}
              disabled={!selected}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded ${buttonPatterns.danger}`}
            >
              <Trash2 className="w-3 h-3" />
              Remove
            </button>
          )}
          {showInfo && (
            <button
              onClick={() => selected && onInfo?.(selected)}
              disabled={!selected}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-white/[0.05] border border-white/[0.08] text-zinc-300 text-[10px] font-semibold transition-colors disabled:opacity-40"
            >
              <Info className="w-3 h-3" />
              Info
            </button>
          )}
          {showDownload && (
            <button
              onClick={() => selected && onDownload?.(selected)}
              disabled={!selected}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-white/[0.05] border border-white/[0.08] text-zinc-300 text-[10px] font-semibold transition-colors disabled:opacity-40"
            >
              <Download className="w-3 h-3" />
              Get
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Morph slider (modelling right panel) ─────────────────────────────────────

interface MorphTarget {
  name: string;
  value: number;
  min?: number;
  max?: number;
  group?: string;
}

function MorphSlider({
  target,
  onChange,
}: {
  target: MorphTarget;
  onChange: (name: string, val: number) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-1.5 hover:bg-white/[0.02] rounded">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-300 font-mono truncate max-w-[140px]">
          {target.name}
        </span>
        <span className={`${typographyPatterns.mono} text-zinc-500 ml-1`}>
          {target.value.toFixed(2)}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(target.name, Math.max(target.min ?? -1, target.value - 0.05))}
          className={buttonPatterns.icon.tiny}
        >
          <Minus className="w-2.5 h-2.5" />
        </button>
        <input
          type="range"
          min={target.min ?? -1}
          max={target.max ?? 1}
          step={0.01}
          value={target.value}
          onChange={(e) => onChange(target.name, Number(e.target.value))}
          className={controlPatterns.range.base}
        />
        <button
          onClick={() => onChange(target.name, Math.min(target.max ?? 1, target.value + 0.05))}
          className={buttonPatterns.icon.tiny}
        >
          <Plus className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Export right panel ───────────────────────────────────────────────────────

const EXPORT_TYPES: ExportType[] = [".glb", ".gltf", ".obj", ".stl", ".bvh"];
const SCALE_ITEMS = [
  { value: 0.1, label: "0.1   Meter" },
  { value: 1.0, label: "1.0   Decimeter" },
  { value: 3.937, label: "3.937 Inch" },
  { value: 10.0, label: "10.0  Centimeter" },
  { value: 100.0, label: "100.0 Millimeter" },
];

function ExportRightContent({
  data,
  onChange,
}: {
  data: ExportFormData;
  onChange: (patch: Partial<ExportFormData>) => void;
}) {
  const isGltf = data.exportType === ".glb" || data.exportType === ".gltf";
  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex flex-col gap-1">
        <FieldLabel>Export type</FieldLabel>
        <div className="flex flex-wrap gap-1">
          {EXPORT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => onChange({ exportType: t })}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors ${data.exportType === t
                ? buttonPatterns.category.active
                : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] border border-white/[0.06]"
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {isGltf && (
        <div className="flex flex-col gap-1">
          <FieldLabel>Scale</FieldLabel>
          <select
            value={data.scaleIndex}
            onChange={(e) => onChange({ scaleIndex: Number(e.target.value) })}
            className={controlPatterns.select.base}
          >
            {SCALE_ITEMS.map((s, i) => (
              <option key={i} value={i}>{s.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <FieldLabel>Output filename</FieldLabel>
        <p className="text-[10px] text-zinc-500 font-mono">
          {data.exportFolder}/{data.filename || "character"}{data.exportType}
        </p>
      </div>
    </div>
  );
}

// ─── Main ContextPanel ────────────────────────────────────────────────────────

export interface ContextPanelState {
  // image grids
  skinItems: ImageItem[];
  characterItems: ImageItem[];
  equipItems: ImageItem[];
  animItems: ImageItem[];
  selectedSkin: string;
  selectedChar: string;
  selectedEquip: string;
  selectedAnim: string;
  skinFilter: string;

  // morph targets
  morphTargets: MorphTarget[];
  morphFilter: string;

  // expression/pose units in right panel
  exprUnits: { name: string; value: number }[];
  poseUnits: { name: string; value: number }[];
}

export const DEFAULT_CONTEXT_STATE: ContextPanelState = {
  skinItems: [],
  characterItems: [],
  equipItems: [],
  animItems: [],
  selectedSkin: "",
  selectedChar: "",
  selectedEquip: "",
  selectedAnim: "",
  skinFilter: "",
  morphTargets: [],
  morphFilter: "",
  exprUnits: [],
  poseUnits: [],
};

export function ContextPanel({
  toolMode,
  categoryMode,
  state,
  onStateChange,
  exportData,
  onExportDataChange,
  onUseItem,
  onRemoveItem,
  onInfoItem,
  onDownloadItem,
  onMorphChange,
}: {
  toolMode: ToolMode;
  categoryMode: number;
  state: ContextPanelState;
  onStateChange: (patch: Partial<ContextPanelState>) => void;
  exportData: ExportFormData;
  onExportDataChange: (patch: Partial<ExportFormData>) => void;
  onUseItem: (type: string, name: string) => void;
  onRemoveItem: (type: string, name: string) => void;
  onInfoItem: (type: string, name: string) => void;
  onDownloadItem: (type: string, name: string) => void;
  onMorphChange: (name: string, val: number) => void;
}) {
  const [skinSearch, setSkinSearch] = useState("");
  const [morphSearch, setMorphSearch] = useState("");

  // Determine whether this panel should be visible
  const visible = (() => {
    if (toolMode === 0) return categoryMode >= 1 && categoryMode <= 4;
    if (toolMode === 1) return categoryMode === 0;
    if (toolMode === 2) return true;
    if (toolMode === 3) return [0, 1, 3, 4, 5].includes(categoryMode);
    return false;
  })();

  if (!visible) return null;

  // ── Files ──

  if (toolMode === 0) {
    if (categoryMode === 1) {
      const filtered = state.skinItems.filter(
        (i) =>
          !skinSearch || i.name.toLowerCase().includes(skinSearch.toLowerCase())
      );
      return (
        <div className={panelPatterns.container} style={{ minWidth: 220 }}>
          <PanelTitle>Base material: skin</PanelTitle>
          <div className="p-2 border-b border-white/[0.07] shrink-0">
            <div className={controlPatterns.input.searchWrapper}>
              <Search className={controlPatterns.input.searchIcon} />
              <input
                type="text"
                value={skinSearch}
                onChange={(e) => setSkinSearch(e.target.value)}
                placeholder="filter skins…"
                className={controlPatterns.input.searchInput}
              />
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <ImageGrid
              items={filtered}
              selected={state.selectedSkin}
              onSelect={(n) => onStateChange({ selectedSkin: n })}
              onUse={(n) => onUseItem("skin", n)}
              onDelete={(n) => onRemoveItem("skin", n)}
              onInfo={(n) => onInfoItem("skin", n)}
              buttonMask={7}
            />
          </div>
        </div>
      );
    }

    if (categoryMode === 2) {
      return (
        <div className={panelPatterns.container} style={{ minWidth: 220 }}>
          <PanelTitle>Character MHM Files</PanelTitle>
          <div className="flex-1 overflow-hidden">
            <ImageGrid
              items={state.characterItems}
              selected={state.selectedChar}
              onSelect={(n) => onStateChange({ selectedChar: n })}
              onUse={(n) => onUseItem("character", n)}
              onInfo={(n) => onInfoItem("character", n)}
              buttonMask={5}
            />
          </div>
        </div>
      );
    }

    if (categoryMode === 3) {
      return (
        <div className={panelPatterns.container} style={{ minWidth: 220 }}>
          <PanelTitle>Character MHM Files (select to replace file)</PanelTitle>
          <div className="flex-1 overflow-hidden">
            <ImageGrid
              items={state.characterItems}
              selected={state.selectedChar}
              onSelect={(n) => onStateChange({ selectedChar: n })}
              readOnly
              buttonMask={0}
            />
          </div>
        </div>
      );
    }

    if (categoryMode === 4) {
      return (
        <div className={panelPatterns.container} style={{ minWidth: 220 }}>
          <PanelTitle>Export character</PanelTitle>
          <div className="flex-1 overflow-y-auto">
            <ExportRightContent data={exportData} onChange={onExportDataChange} />
          </div>
        </div>
      );
    }
  }

  // ── Modelling – morph sliders ──

  if (toolMode === 1 && categoryMode === 0) {
    const filtered = state.morphTargets.filter(
      (t) =>
        !morphSearch || t.name.toLowerCase().includes(morphSearch.toLowerCase())
    );
    return (
      <div className={panelPatterns.container} style={{ minWidth: 220 }}>
        <PanelTitle>Morph, category: {morphSearch || "all"}</PanelTitle>
        <div className="p-2 border-b border-white/[0.07] shrink-0">
          <div className={controlPatterns.input.searchWrapper}>
            <Search className={controlPatterns.input.searchIcon} />
            <input
              type="text"
              value={morphSearch}
              onChange={(e) => setMorphSearch(e.target.value)}
              placeholder="filter morphs…"
              className={controlPatterns.input.searchInput}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-xs text-zinc-600 italic text-center py-8">
              {state.morphTargets.length === 0
                ? "Connect to load morph targets."
                : "No morphs match filter."}
            </p>
          ) : (
            filtered.map((t) => (
              <MorphSlider key={t.name} target={t} onChange={onMorphChange} />
            ))
          )}
        </div>
      </div>
    );
  }

  // ── Equipment – image grid ──

  if (toolMode === 2) {
    const equipNames: Record<number, string> = {
      0: "clothes", 1: "hair", 2: "eyes", 3: "eyebrows",
      4: "eyelashes", 5: "teeth", 6: "tongue", 7: "proxy",
    };
    const name = equipNames[categoryMode] ?? "equipment";
    return (
      <div className={panelPatterns.container} style={{ minWidth: 220 }}>
        <PanelTitle>Equipment, category: {name}</PanelTitle>
        <div className="flex-1 overflow-hidden">
          <ImageGrid
            items={state.equipItems}
            selected={state.selectedEquip}
            onSelect={(n) => onStateChange({ selectedEquip: n })}
            onUse={(n) => onUseItem("equipment", n)}
            onDelete={(n) => onRemoveItem("equipment", n)}
            onInfo={(n) => onInfoItem("equipment", n)}
            onDownload={(n) => onDownloadItem("equipment", n)}
            buttonMask={categoryMode === 7 ? 13 : 15}
          />
        </div>
      </div>
    );
  }

  // ── Pose – animation image grids / editors ──

  if (toolMode === 3) {
    const poseNames: Record<number, string> = {
      0: "rigs", 1: "poses", 3: "expressions",
    };

    if ([0, 1, 3].includes(categoryMode)) {
      const name = poseNames[categoryMode];
      return (
        <div className={panelPatterns.container} style={{ minWidth: 220 }}>
          <PanelTitle>Pose and animation, category: {name}</PanelTitle>
          <div className="flex-1 overflow-hidden">
            <ImageGrid
              items={state.animItems}
              selected={state.selectedAnim}
              onSelect={(n) => onStateChange({ selectedAnim: n })}
              onUse={(n) => onUseItem("anim", n)}
              onInfo={(n) => onInfoItem("anim", n)}
              onDownload={(n) => onDownloadItem("anim", n)}
              buttonMask={13}
            />
          </div>
        </div>
      );
    }

    if (categoryMode === 4) {
      return (
        <div className={panelPatterns.container} style={{ minWidth: 220 }}>
          <PanelTitle>Expressions, category</PanelTitle>
          <div className="flex-1 overflow-y-auto">
            {state.exprUnits.length === 0 ? (
              <p className="text-xs text-zinc-600 italic text-center py-8">
                Select an expression category in the left panel.
              </p>
            ) : (
              state.exprUnits.map((u) => (
                <MorphSlider
                  key={u.name}
                  target={{ name: u.name, value: u.value, min: -1, max: 1 }}
                  onChange={(name, val) =>
                    onStateChange({
                      exprUnits: state.exprUnits.map((x) =>
                        x.name === name ? { ...x, value: val } : x
                      ),
                    })
                  }
                />
              ))
            )}
          </div>
        </div>
      );
    }

    if (categoryMode === 5) {
      return (
        <div className={panelPatterns.container} style={{ minWidth: 220 }}>
          <PanelTitle>Poses, category</PanelTitle>
          <div className="flex-1 overflow-y-auto">
            {state.poseUnits.length === 0 ? (
              <p className="text-xs text-zinc-600 italic text-center py-8">
                Select a pose category in the left panel.
              </p>
            ) : (
              state.poseUnits.map((u) => (
                <MorphSlider
                  key={u.name}
                  target={{ name: u.name, value: u.value, min: -1, max: 1 }}
                  onChange={(name, val) =>
                    onStateChange({
                      poseUnits: state.poseUnits.map((x) =>
                        x.name === name ? { ...x, value: val } : x
                      ),
                    })
                  }
                />
              ))
            )}
          </div>
        </div>
      );
    }
  }

  return null;
}

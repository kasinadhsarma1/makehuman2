"use client";

/**
 * Mode-3 (Pose) Panels
 * Mirrors drawLeftPanel() tool_mode == 3 cases from MHMainWindow.
 *
 * cat 0  "Rigs :: filter"              – RigsPanel
 * cat 1  "Poses :: filter"             – PosesPanel  (+ AnimMode)
 * cat 2  "Animation Player"            – AnimPlayerPanel
 * cat 3  "Expressions :: filter"       – ExpressionsPanel (+ AnimMode)
 * cat 4  "Expressions :: editor"       – ExpressionEditorPanel (tree + class widgets)
 * cat 5  "Pose :: editor"              – PoseEditorPanel (tree + class widgets)
 */

import { typographyPatterns, controlPatterns, panelPatterns } from "@/lib/patterns";
import { useState } from "react";
import {
  Search, Play, Pause, SkipBack, SkipForward, ChevronFirst,
  ChevronLast, RefreshCw, CheckSquare, Square, ChevronRight,
  ChevronDown, Minus, Plus,
} from "lucide-react";

// ─── Shared ───────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500 mb-1">
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className={typographyPatterns.label}>
      {children}
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
  tooltip,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  tooltip?: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      title={tooltip}
      className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white transition-colors py-0.5"
    >
      {checked ? (
        <CheckSquare className="w-3.5 h-3.5 text-violet-400 shrink-0" />
      ) : (
        <Square className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
      )}
      {label}
    </button>
  );
}

function FilterSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className={controlPatterns.input.searchWrapper}>
      <Search className={controlPatterns.input.searchIcon} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "filter…"}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded pl-7 pr-2 py-1.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-violet-500/40"
      />
    </div>
  );
}

function AssetList({
  items,
  selected,
  onSelect,
  emptyMsg,
}: {
  items: string[];
  selected: string;
  onSelect: (i: string) => void;
  emptyMsg?: string;
}) {
  return (
    <div className="rounded border border-white/[0.06] bg-black/20 overflow-hidden max-h-48 overflow-y-auto">
      {items.length === 0 ? (
        <p className="px-3 py-5 text-xs text-zinc-600 italic text-center">
          {emptyMsg ?? "No items loaded."}
        </p>
      ) : (
        items.map((item) => (
          <button
            key={item}
            onClick={() => onSelect(item)}
            className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors ${
              selected === item
                ? "bg-orange-600/50 text-white"
                : "text-zinc-300 hover:bg-white/[0.04]"
            }`}
          >
            {item}
          </button>
        ))
      )}
    </div>
  );
}

// ─── cat 0 : Rigs :: filter ───────────────────────────────────────────────────

export function RigsPanel({
  filter,
  onFilterChange,
  rigs,
  selectedRig,
  onSelectRig,
  onLoad,
}: {
  filter: string;
  onFilterChange: (v: string) => void;
  rigs: string[];
  selectedRig: string;
  onSelectRig: (r: string) => void;
  onLoad: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Rigs :: filter</SectionTitle>
      <FilterSearch value={filter} onChange={onFilterChange} placeholder="filter rigs…" />
      <AssetList
        items={rigs.filter((r) => !filter || r.toLowerCase().includes(filter.toLowerCase()))}
        selected={selectedRig}
        onSelect={onSelectRig}
        emptyMsg="Connect to core to list available rigs."
      />
      <button
        onClick={onLoad}
        disabled={!selectedRig}
        className="flex items-center gap-2 px-3 py-2 rounded bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold transition-colors disabled:opacity-40"
      >
        Load rig
      </button>
    </div>
  );
}

// ─── cat 1 : Poses :: filter ──────────────────────────────────────────────────

export function PosesPanel({
  filter,
  onFilterChange,
  poses,
  selectedPose,
  onSelectPose,
  onLoad,
}: {
  filter: string;
  onFilterChange: (v: string) => void;
  poses: string[];
  selectedPose: string;
  onSelectPose: (p: string) => void;
  onLoad: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Poses :: filter</SectionTitle>
      <FilterSearch value={filter} onChange={onFilterChange} placeholder="filter poses…" />
      <AssetList
        items={poses.filter((p) => !filter || p.toLowerCase().includes(filter.toLowerCase()))}
        selected={selectedPose}
        onSelect={onSelectPose}
        emptyMsg="Connect to core to list available poses."
      />
      <button
        onClick={onLoad}
        disabled={!selectedPose}
        className="flex items-center gap-2 px-3 py-2 rounded bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold transition-colors disabled:opacity-40"
      >
        Load pose
      </button>
    </div>
  );
}

// ─── cat 2 : Animation Player ─────────────────────────────────────────────────

export interface AnimPlayerState {
  animName: string;
  frameCount: number;
  currentFrame: number;
  looping: boolean;
  doFaceAnim: boolean;
  doCorrections: boolean;
  rotSkybox: boolean;
  rotAngle: number;
  speedValue: number;
}

export const DEFAULT_ANIM_PLAYER: AnimPlayerState = {
  animName: "(no animation loaded)",
  frameCount: 0,
  currentFrame: 0,
  looping: false,
  doFaceAnim: true,
  doCorrections: false,
  rotSkybox: false,
  rotAngle: 0.5,
  speedValue: 24,
};

export function AnimPlayerPanel({
  state,
  onChange,
  onFirst,
  onPrev,
  onNext,
  onLast,
  onToggleLoop,
}: {
  state: AnimPlayerState;
  onChange: (patch: Partial<AnimPlayerState>) => void;
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
  onToggleLoop: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Animation Player</SectionTitle>

      {/* Animation info */}
      <div className="px-3 py-2 rounded bg-black/20 border border-white/[0.06]">
        <p className="text-xs text-zinc-300 font-mono truncate">{state.animName}</p>
        {state.frameCount > 0 && (
          <p className="text-[10px] text-zinc-500 mt-0.5">
            Frame: {state.currentFrame + 1} / {state.frameCount}
          </p>
        )}
      </div>

      {/* Playback buttons */}
      <div className="flex items-center gap-1">
        {[
          { icon: <ChevronFirst className="w-4 h-4" />, tip: "First frame", action: onFirst },
          { icon: <SkipBack className="w-4 h-4" />, tip: "Previous frame", action: onPrev },
          { icon: <SkipForward className="w-4 h-4" />, tip: "Next frame", action: onNext },
          { icon: <ChevronLast className="w-4 h-4" />, tip: "Last frame", action: onLast },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            title={btn.tip}
            disabled={state.frameCount === 0}
            className="flex-1 h-8 rounded flex items-center justify-center bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 transition-colors disabled:opacity-30"
          >
            {btn.icon}
          </button>
        ))}
        <button
          onClick={onToggleLoop}
          title="Toggle animation loop (ESC = stop)"
          className={`flex-1 h-8 rounded flex items-center justify-center transition-colors border ${
            state.looping
              ? "bg-orange-600/70 border-orange-500/50 text-white"
              : "bg-white/[0.04] border-white/[0.06] text-zinc-400 hover:bg-white/[0.08]"
          }`}
        >
          {state.looping ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>

      {/* Frame slider */}
      {state.frameCount > 1 && (
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <FieldLabel>Frame number:</FieldLabel>
            <span className={`${typographyPatterns.mono} text-zinc-400`}>{state.currentFrame}</span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, state.frameCount - 1)}
            value={state.currentFrame}
            onChange={(e) => onChange({ currentFrame: Number(e.target.value) })}
            className="w-full accent-orange-500 h-1.5"
          />
        </div>
      )}

      {/* Options */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-white/[0.06]">
        <Checkbox
          label="Face animation"
          checked={state.doFaceAnim}
          onChange={(v) => onChange({ doFaceAnim: v })}
        />
        <Checkbox
          label="Overlay corrections"
          checked={state.doCorrections}
          onChange={(v) => onChange({ doCorrections: v })}
        />
        <Checkbox
          label="Rotate skybox"
          checked={state.rotSkybox}
          onChange={(v) => onChange({ rotSkybox: v })}
        />
      </div>

      {/* Speed */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <FieldLabel>Speed (fps):</FieldLabel>
          <span className={`${typographyPatterns.mono} text-zinc-400`}>{state.speedValue}</span>
        </div>
        <input
          type="range"
          min={1}
          max={120}
          value={state.speedValue}
          onChange={(e) => onChange({ speedValue: Number(e.target.value) })}
          className="w-full accent-orange-500 h-1.5"
        />
      </div>

      {/* Rotation angle */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <FieldLabel>Rotation angle:</FieldLabel>
          <span className={`${typographyPatterns.mono} text-zinc-400`}>{state.rotAngle}</span>
        </div>
        <input
          type="range"
          min={0}
          max={5}
          step={0.1}
          value={state.rotAngle}
          onChange={(e) => onChange({ rotAngle: Number(e.target.value) })}
          className="w-full accent-orange-500 h-1.5"
        />
      </div>
    </div>
  );
}

// ─── cat 3 : Expressions :: filter ───────────────────────────────────────────

export function ExpressionsPanel({
  filter,
  onFilterChange,
  expressions,
  selectedExpr,
  onSelectExpr,
  onLoad,
}: {
  filter: string;
  onFilterChange: (v: string) => void;
  expressions: string[];
  selectedExpr: string;
  onSelectExpr: (e: string) => void;
  onLoad: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Expressions :: filter</SectionTitle>
      <FilterSearch value={filter} onChange={onFilterChange} placeholder="filter expressions…" />
      <AssetList
        items={expressions.filter(
          (e) => !filter || e.toLowerCase().includes(filter.toLowerCase())
        )}
        selected={selectedExpr}
        onSelect={onSelectExpr}
        emptyMsg="Connect to core to list available expressions."
      />
      <button
        onClick={onLoad}
        disabled={!selectedExpr}
        className="flex items-center gap-2 px-3 py-2 rounded bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold transition-colors disabled:opacity-40"
      >
        Load expression
      </button>
    </div>
  );
}

// ─── Shared pose/expression editor ───────────────────────────────────────────

const FACE_CATEGORIES: Record<string, string[]> = {
  "Basic": ["Brow raise", "Eye close", "Smile", "Mouth open"],
  "Eyes": ["Eye L close", "Eye R close", "Eye squint", "Eye wide"],
  "Mouth": ["Mouth smile L", "Mouth smile R", "Mouth frown", "Lip upper"],
  "Brow": ["Brow L raise", "Brow R raise", "Brow inner up", "Brow anger"],
  "Nose & Cheek": ["Nose sneer", "Cheek puff", "Cheek squint"],
};

const BODY_CATEGORIES: Record<string, string[]> = {
  "Spine": ["Spine bend", "Spine twist", "Neck tilt", "Head nod"],
  "Arms": ["Shoulder raise L", "Shoulder raise R", "Elbow flex L", "Elbow flex R"],
  "Hands": ["Hand grip L", "Hand grip R", "Fingers spread"],
  "Legs": ["Hip flex L", "Hip flex R", "Knee bend L", "Knee bend R"],
  "Feet": ["Ankle flex L", "Ankle flex R", "Toe curl"],
};

interface PoseUnit {
  name: string;
  value: number;
}

function PoseEditorTree({
  categories,
  selectedCat,
  onSelectCat,
}: {
  categories: Record<string, string[]>;
  selectedCat: string;
  onSelectCat: (c: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Basic: true,
    Spine: true,
  });

  return (
    <div className="rounded border border-white/[0.06] bg-black/20 overflow-hidden max-h-40 overflow-y-auto">
      {Object.entries(categories).map(([group, subs]) => (
        <div key={group}>
          <button
            onClick={() =>
              setExpanded((e) => ({ ...e, [group]: !e[group] }))
            }
            className={`w-full flex items-center gap-1.5 px-2 py-1.5 ${panelPatterns.titleTextAlt} hover:bg-white/[0.05]`}
          >
            {expanded[group] ? (
              <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 text-zinc-500 shrink-0" />
            )}
            {group}
          </button>
          {expanded[group] &&
            subs.map((sub) => (
              <button
                key={sub}
                onClick={() => onSelectCat(sub)}
                className={`w-full text-left px-6 py-1 text-xs transition-colors ${
                  selectedCat === sub
                    ? "bg-orange-600/50 text-white"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
              >
                {sub}
              </button>
            ))}
        </div>
      ))}
    </div>
  );
}

function PoseUnitSlider({
  unit,
  onChange,
}: {
  unit: PoseUnit;
  onChange: (name: string, val: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-zinc-400 w-24 shrink-0 truncate font-mono">
        {unit.name}
      </span>
      <button
        onClick={() => onChange(unit.name, Math.max(-1, unit.value - 0.1))}
        className="w-5 h-5 rounded bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-zinc-200 flex items-center justify-center shrink-0"
      >
        <Minus className="w-3 h-3" />
      </button>
      <input
        type="range"
        min={-1}
        max={1}
        step={0.01}
        value={unit.value}
        onChange={(e) => onChange(unit.name, Number(e.target.value))}
        className={controlPatterns.range.base}
      />
      <button
        onClick={() => onChange(unit.name, Math.min(1, unit.value + 0.1))}
        className="w-5 h-5 rounded bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-zinc-200 flex items-center justify-center shrink-0"
      >
        <Plus className="w-3 h-3" />
      </button>
      <span className={`${typographyPatterns.mono} text-zinc-500 w-8 text-right shrink-0`}>
        {unit.value.toFixed(2)}
      </span>
    </div>
  );
}

// ─── cat 4 : Expression editor ────────────────────────────────────────────────

export function ExpressionEditorPanel({
  selectedCat,
  onSelectCat,
  units,
  onUnitChange,
  onSave,
  onLoad,
}: {
  selectedCat: string;
  onSelectCat: (c: string) => void;
  units: PoseUnit[];
  onUnitChange: (name: string, val: number) => void;
  onSave: () => void;
  onLoad: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Expressions :: editor</SectionTitle>
      <p className="text-[10px] text-zinc-500">Expression category:</p>
      <PoseEditorTree
        categories={FACE_CATEGORIES}
        selectedCat={selectedCat}
        onSelectCat={onSelectCat}
      />
      <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
        {units.map((u) => (
          <PoseUnitSlider key={u.name} unit={u} onChange={onUnitChange} />
        ))}
        {units.length === 0 && (
          <p className="text-[10px] text-zinc-600 italic text-center py-2">
            Select a category to edit expression units.
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="flex-1 px-3 py-1.5 rounded bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold transition-colors"
        >
          Save Expression
        </button>
        <button
          onClick={onLoad}
          className="flex-1 px-3 py-1.5 rounded bg-white/[0.05] border border-white/[0.08] text-zinc-300 text-xs font-semibold transition-colors hover:bg-white/[0.09]"
        >
          Load Expression
        </button>
      </div>
    </div>
  );
}

// ─── cat 5 : Pose editor ──────────────────────────────────────────────────────

export function PoseEditorPanel({
  selectedCat,
  onSelectCat,
  units,
  onUnitChange,
  onSave,
  onLoad,
  onReset,
}: {
  selectedCat: string;
  onSelectCat: (c: string) => void;
  units: PoseUnit[];
  onUnitChange: (name: string, val: number) => void;
  onSave: () => void;
  onLoad: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Pose :: editor</SectionTitle>
      <p className="text-[10px] text-zinc-500">Pose category:</p>
      <PoseEditorTree
        categories={BODY_CATEGORIES}
        selectedCat={selectedCat}
        onSelectCat={onSelectCat}
      />
      <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
        {units.map((u) => (
          <PoseUnitSlider key={u.name} unit={u} onChange={onUnitChange} />
        ))}
        {units.length === 0 && (
          <p className="text-[10px] text-zinc-600 italic text-center py-2">
            Select a category to edit pose units.
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="flex-1 px-3 py-1.5 rounded bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold transition-colors"
        >
          Save Pose
        </button>
        <button
          onClick={onLoad}
          className="flex-1 px-3 py-1.5 rounded bg-white/[0.05] border border-white/[0.08] text-zinc-300 text-xs font-semibold transition-colors hover:bg-white/[0.09]"
        >
          Load Pose
        </button>
        <button
          onClick={onReset}
          title="Reset pose"
          className="w-8 h-8 rounded bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:bg-white/[0.08] flex items-center justify-center transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

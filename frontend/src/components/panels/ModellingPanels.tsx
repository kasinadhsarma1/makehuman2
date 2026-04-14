"use client";

/**
 * Mode-1 (Modelling) Panels
 * cat 0  "Modify character :: categories"  – ModellingPanel (tree + model_buttons)
 * cat 1  "Random character :: parameters"  – RandomizePanel (sliders + options)
 *
 * Mirrors: RandomForm, ScaleComboArray, model_buttons from MHMainWindow
 */

import patterns from "@/lib/patterns";
import { useState } from "react";
import {
  RotateCcw, ArrowLeftRight, Shuffle, ChevronRight, ChevronDown,
  CheckSquare, Square, Search,
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
    <label className={patterns.text.label}>
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

function SimpleSlider({
  label,
  min,
  max,
  value,
  onChange,
  tooltip,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  tooltip?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5" title={tooltip}>
      <div className="flex items-center justify-between">
        <FieldLabel>{label}</FieldLabel>
        <span className={`${patterns.text.mono} text-zinc-400`}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-orange-500 h-1.5"
      />
    </div>
  );
}

// ─── Category tree (simplified) ───────────────────────────────────────────────

const MORPH_CATEGORIES: Record<string, string[]> = {
  "Head": ["Head shape", "Nose", "Mouth", "Eyes", "Ears", "Chin", "Forehead"],
  "Body": ["Height", "Weight", "Proportions", "Muscles", "Posture"],
  "Torso": ["Chest", "Waist", "Hips", "Shoulders"],
  "Arms & Hands": ["Upper arms", "Lower arms", "Hands", "Fingers"],
  "Legs & Feet": ["Upper legs", "Lower legs", "Feet", "Toes"],
  "Skin": ["Skin details", "Age"],
  "Gender": ["Male / Female", "Androgynous"],
};

function CategoryTree({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (cat: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Head: true });
  const [search, setSearch] = useState("");

  const toggle = (g: string) =>
    setExpanded((e) => ({ ...e, [g]: !e[g] }));

  return (
    <div className="flex flex-col gap-1">
      <div className={`${patterns.input.searchWrapper} mb-1`}>
        <Search className={patterns.input.searchIcon} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="filter categories…"
          className={`w-full bg-white/[0.04] border border-white/[0.08] rounded pl-7 pr-2 py-1 text-xs text-zinc-300 focus:outline-none focus:${patterns.grid.itemHighlight}`}
        />
      </div>
      <div className="rounded border border-white/[0.06] bg-black/20 overflow-hidden max-h-56 overflow-y-auto">
        {Object.entries(MORPH_CATEGORIES)
          .filter(
            ([g, subs]) =>
              !search ||
              g.toLowerCase().includes(search.toLowerCase()) ||
              subs.some((s) => s.toLowerCase().includes(search.toLowerCase()))
          )
          .map(([group, subs]) => (
            <div key={group}>
              <button
                onClick={() => toggle(group)}
                className={`w-full flex items-center gap-1.5 px-2 py-1.5 ${patterns.panel.titleTextAlt} hover:bg-white/[0.05] transition-colors`}
              >
                {expanded[group] ? (
                  <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-zinc-500 shrink-0" />
                )}
                {group}
              </button>
              {expanded[group] &&
                subs
                  .filter(
                    (s) =>
                      !search || s.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((sub) => (
                    <button
                      key={sub}
                      onClick={() => onSelect(sub)}
                      className={`w-full text-left px-6 py-1 text-xs transition-colors ${
                        selected === sub
                          ? "bg-orange-600/60 text-white"
                          : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── Model action buttons (Reset, Sym R→L, Sym L→R, Sym always) ──────────────

function ModelButtons({
  symActive,
  onReset,
  onSymRtoL,
  onSymLtoR,
  onSymToggle,
}: {
  symActive: boolean;
  onReset: () => void;
  onSymRtoL: () => void;
  onSymLtoR: () => void;
  onSymToggle: () => void;
}) {
  return (
    <div className="flex gap-1 pt-1">
      {[
        { icon: <RotateCcw className="w-4 h-4" />, tip: "Reset all targets", action: onReset, check: false, active: false },
        { icon: <ArrowLeftRight className="w-4 h-4" />, tip: "Symmetry, right to left", action: onSymRtoL, check: false, active: false },
        { icon: <ArrowLeftRight className="w-4 h-4 scale-x-[-1]" />, tip: "Symmetry, left to right", action: onSymLtoR, check: false, active: false },
        { icon: <ArrowLeftRight className="w-4 h-4" />, tip: "Symmetry applied always", action: onSymToggle, check: true, active: symActive },
      ].map((btn, i) => (
        <button
          key={i}
          onClick={btn.action}
          title={btn.tip}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors text-xs border ${
            btn.check && btn.active
              ? "bg-orange-600/70 border-orange-500/50 text-white"
              : "bg-white/[0.04] border-white/[0.06] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200"
          }`}
        >
          {btn.icon}
        </button>
      ))}
    </div>
  );
}

// ─── cat 0 : Modify character :: categories ───────────────────────────────────

export function ModellingPanel({
  selectedCategory,
  onSelectCategory,
  symActive,
  onReset,
  onSymRtoL,
  onSymLtoR,
  onSymToggle,
}: {
  selectedCategory: string;
  onSelectCategory: (c: string) => void;
  symActive: boolean;
  onReset: () => void;
  onSymRtoL: () => void;
  onSymLtoR: () => void;
  onSymToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Modify character :: categories</SectionTitle>
      <CategoryTree selected={selectedCategory} onSelect={onSelectCategory} />
      <ModelButtons
        symActive={symActive}
        onReset={onReset}
        onSymRtoL={onSymRtoL}
        onSymLtoR={onSymLtoR}
        onSymToggle={onSymToggle}
      />
    </div>
  );
}

// ─── cat 1 : Random character :: parameters ───────────────────────────────────

const RANDOM_GROUPS: string[] = [
  "head", "body", "torso", "arms", "hands", "legs", "feet",
  "face", "details", "gender",
];

const GENDER_OPTIONS = ["any", "female only", "male only", "male or female"];

export interface RandomizeValues {
  gender: number;
  weirdoFactor: number;
  idealFactor: number;
  symFactor: number;
  reset: boolean;
  groups: Record<string, boolean>;
}

export const DEFAULT_RANDOMIZE_VALUES: RandomizeValues = {
  gender: 0,
  weirdoFactor: 20,
  idealFactor: 50,
  symFactor: 100,
  reset: true,
  groups: Object.fromEntries(RANDOM_GROUPS.map((g) => [g, true])),
};

export function RandomizePanel({
  values,
  onChange,
  onApply,
  loading,
}: {
  values: RandomizeValues;
  onChange: (patch: Partial<RandomizeValues>) => void;
  onApply: () => void;
  loading: boolean;
}) {
  const toggleGroup = (g: string) =>
    onChange({ groups: { ...values.groups, [g]: !values.groups[g] } });

  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Random character :: parameters</SectionTitle>

      {/* Gender */}
      <div className="flex flex-col gap-1">
        <FieldLabel>Gender</FieldLabel>
        <select
          value={values.gender}
          onChange={(e) => onChange({ gender: Number(e.target.value) })}
          className={patterns.input.select}
        >
          {GENDER_OPTIONS.map((o, i) => (
            <option key={i} value={i}>{o}</option>
          ))}
        </select>
      </div>

      {/* Groups multi-select */}
      <div className="flex flex-col gap-1">
        <FieldLabel>Groups</FieldLabel>
        <div className="rounded border border-white/[0.06] bg-black/20 overflow-hidden max-h-36 overflow-y-auto">
          {RANDOM_GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => toggleGroup(g)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                values.groups[g]
                  ? "bg-orange-600/30 text-orange-200"
                  : "text-zinc-500 hover:bg-white/[0.03]"
              }`}
            >
              {values.groups[g] ? (
                <CheckSquare className="w-3 h-3 text-orange-400 shrink-0" />
              ) : (
                <Square className="w-3 h-3 text-zinc-600 shrink-0" />
              )}
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <SimpleSlider
        label="Weirdo factor:"
        min={0}
        max={100}
        value={values.weirdoFactor}
        onChange={(v) => onChange({ weirdoFactor: v })}
        tooltip="The higher the value, the funnier the result."
      />
      <SimpleSlider
        label="Minimum ideal factor:"
        min={0}
        max={100}
        value={values.idealFactor}
        onChange={(v) => onChange({ idealFactor: v })}
        tooltip="75 means nicer characters are created (75–100)"
      />
      <SimpleSlider
        label="Symmetry factor:"
        min={0}
        max={100}
        value={values.symFactor}
        onChange={(v) => onChange({ symFactor: v })}
        tooltip="100 = full symmetry, low values can create bizarre geometries."
      />

      <Checkbox
        label="Reset character to default before"
        checked={values.reset}
        onChange={(v) => onChange({ reset: v })}
      />

      <button
        onClick={onApply}
        disabled={loading}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold transition-colors disabled:opacity-40 mt-1"
      >
        <Shuffle className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Randomizing…" : "Randomize"}
      </button>
    </div>
  );
}

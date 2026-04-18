"use client";

/**
 * Mode-1 (Modelling) Panels
 * cat 0  "Modify character :: categories"  – ModellingPanel (tree + model_buttons)
 * cat 1  "Random character :: parameters"  – RandomizePanel (sliders + options)
 *
 * Mirrors: RandomForm, ScaleComboArray, model_buttons from MHMainWindow
 */

import { typographyPatterns, controlPatterns, panelPatterns, buttonPatterns } from "@/lib/patterns";
import { useState } from "react";
import {
  RotateCcw, ArrowLeftRight, Shuffle, ChevronRight, ChevronDown,
  CheckSquare, Square, Search,
} from "lucide-react";

// ─── Shared ───────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className={typographyPatterns.sectionLabel}>{children}</p>
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
      className={buttonPatterns.checkboxRow}
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
        <span className={`${typographyPatterns.mono} text-zinc-400`}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={controlPatterns.range.base}
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
      <div className={`${controlPatterns.input.searchWrapper} mb-1`}>
        <Search className={controlPatterns.input.searchIcon} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="filter categories…"
          className={controlPatterns.input.searchInput}
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
                className={`w-full flex items-center gap-1.5 px-2 py-1.5 ${panelPatterns.titleTextAlt} hover:bg-white/[0.05] transition-colors`}
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
                      className={`w-full text-left px-6 py-1 text-xs transition-colors ${selected === sub
                          ? buttonPatterns.treeItemActive
                          : buttonPatterns.treeItemBase
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
          className={btn.check && btn.active
            ? buttonPatterns.iconToggle.active
            : buttonPatterns.iconToggle.base
          }
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

      {/* Gender */}
      <div className="flex flex-col gap-1">
        <FieldLabel>Gender</FieldLabel>
        <select
          value={values.gender}
          onChange={(e) => onChange({ gender: Number(e.target.value) })}
          className={controlPatterns.select.base}
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
              className={values.groups[g]
                ? buttonPatterns.groupRow.active
                : buttonPatterns.groupRow.base
              }
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
        className={buttonPatterns.fullPrimaryLg}
      >
        <Shuffle className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Randomizing…" : "Randomize"}
      </button>
    </div>
  );
}

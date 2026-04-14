"use client";

/**
 * Mode-4 (Render) Panel
 * Mirrors Renderer class from gui/renderer.py
 *
 * "Rendering :: parameters" – width, height, rotation, transparent,
 * posed, corrections, frame slider, smooth subdivision, Render button.
 */

import patterns from "@/lib/patterns";
import { Camera, Save, Eye, CheckSquare, Square } from "lucide-react";

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

export interface RendererValues {
  width: number;
  height: number;
  angle: number;
  transparent: boolean;
  posed: boolean;
  doCorrections: boolean;
  currentFrame: number;
  frameCount: number;
  subdivided: boolean;
  imageSaved: boolean;
}

export const DEFAULT_RENDERER_VALUES: RendererValues = {
  width: 1000,
  height: 1000,
  angle: 0,
  transparent: false,
  posed: false,
  doCorrections: false,
  currentFrame: 0,
  frameCount: 0,
  subdivided: false,
  imageSaved: false,
};

export function RenderPanel({
  values,
  onChange,
  onRender,
  onSaveImage,
  onViewImage,
  hasAnimation,
  loading,
}: {
  values: RendererValues;
  onChange: (patch: Partial<RendererValues>) => void;
  onRender: () => void;
  onSaveImage: () => void;
  onViewImage: () => void;
  hasAnimation: boolean;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500">
        Rendering :: parameters
      </p>

      {/* Canvas size */}
      <div>
        <p className="text-[10px] text-zinc-500 mb-1.5">
          Render to offscreen canvas of size:
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <FieldLabel>Width</FieldLabel>
            <input
              type="number"
              value={values.width}
              onChange={(e) => onChange({ width: Number(e.target.value) })}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1.5 text-xs font-mono text-zinc-300 focus:outline-none"
              min={1}
            />
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel>Height</FieldLabel>
            <input
              type="number"
              value={values.height}
              onChange={(e) => onChange({ height: Number(e.target.value) })}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1.5 text-xs font-mono text-zinc-300 focus:outline-none"
              min={1}
            />
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-1.5">
        <Checkbox
          label="transparent canvas"
          checked={values.transparent}
          onChange={(v) => onChange({ transparent: v })}
        />
        {hasAnimation && (
          <>
            <Checkbox
              label="overlay corrections"
              checked={values.doCorrections}
              onChange={(v) => onChange({ doCorrections: v })}
            />
            <Checkbox
              label="character posed"
              checked={values.posed}
              onChange={(v) => onChange({ posed: v })}
            />
          </>
        )}
      </div>

      {/* Frame slider (only if animation has multiple frames) */}
      {hasAnimation && values.frameCount > 1 && (
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <FieldLabel>Frame number:</FieldLabel>
            <span className={`${patterns.text.mono} text-zinc-400`}>
              {values.currentFrame}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, values.frameCount - 1)}
            value={values.currentFrame}
            onChange={(e) => onChange({ currentFrame: Number(e.target.value) })}
            className="w-full accent-orange-500 h-1.5"
          />
        </div>
      )}

      {/* Rotation */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <FieldLabel>Rotation:</FieldLabel>
          <span className={`${patterns.text.mono} text-zinc-400`}>{values.angle}°</span>
        </div>
        <input
          type="range"
          min={-180}
          max={180}
          value={values.angle}
          onChange={(e) => onChange({ angle: Number(e.target.value) })}
          className="w-full accent-orange-500 h-1.5"
        />
      </div>

      {/* Smooth (subdivide) */}
      <button
        onClick={() => onChange({ subdivided: !values.subdivided })}
        title="Select all other options before using subdivision!"
        className={`w-full px-3 py-2 rounded text-xs font-semibold transition-colors border ${
          values.subdivided
            ? "bg-orange-600/70 border-orange-500/50 text-white"
            : "bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:bg-white/[0.08]"
        }`}
      >
        {values.subdivided ? "Smooth (subdivided) ✓" : "Smooth (subdivided)"}
      </button>

      {/* Actions */}
      <button
        onClick={onRender}
        disabled={loading}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-violet-700 hover:bg-violet-600 text-white text-xs font-semibold transition-colors disabled:opacity-40"
      >
        <Camera className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
        {loading ? "Rendering…" : "Render"}
      </button>

      <div className="flex gap-2">
        <button
          onClick={onViewImage}
          disabled={!values.imageSaved}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-semibold transition-colors hover:bg-white/[0.08] disabled:opacity-30"
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
        <button
          onClick={onSaveImage}
          disabled={!values.imageSaved}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-semibold transition-colors hover:bg-white/[0.08] disabled:opacity-30"
        >
          <Save className="w-3.5 h-3.5" />
          Save image
        </button>
      </div>
    </div>
  );
}

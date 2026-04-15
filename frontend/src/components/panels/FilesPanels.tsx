"use client";

/**
 * Mode-0 (Files) Panels
 * Mirrors drawLeftPanel() tool_mode == 0 cases from MHMainWindow.
 *
 * cat 0  "Base mesh :: selection"     – BaseMeshPanel
 * cat 1  "Select skin :: parameters"  – SkinPanel
 * cat 2  "Load file :: filter"        – LoadFilePanel
 * cat 3  "Save file :: parameters"    – SaveFilePanel
 * cat 4  "Export file :: parameters"  – ExportPanel
 * cat 5  "Import file :: parameters"  – DownloadPanel
 */

import { typographyPatterns, controlPatterns, buttonPatterns } from "@/lib/patterns";
import {
  FolderOpen, Save, Upload, Download, Trash2, RefreshCw,
  Search, User, Tag, Hash, FileText, CheckSquare, Square,
  ChevronDown,
} from "lucide-react";

// ─── Shared primitives ────────────────────────────────────────────────────────

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

function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-violet-500/40 disabled:opacity-50`}
    />
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

function ActionBtn({
  icon,
  label,
  onClick,
  variant = "default",
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  variant?: "default" | "primary" | "danger";
  disabled?: boolean;
}) {
  const cls = {
    default: "bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-zinc-300",
    primary: "bg-violet-700 hover:bg-violet-600 border border-violet-600 text-white",
    danger: "bg-red-900/30 hover:bg-red-800/50 border border-red-700/30 text-red-300",
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${cls} disabled:opacity-40`}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── cat 0 : Base mesh selection ──────────────────────────────────────────────

export function BaseMeshPanel({
  meshes,
  selected,
  onSelect,
  onConfirm,
}: {
  meshes: string[];
  selected: string;
  onSelect: (m: string) => void;
  onConfirm: (m: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5 rounded border border-white/[0.06] bg-black/20 overflow-hidden">
        {meshes.map((m) => (
          <button
            key={m}
            onClick={() => onSelect(m)}
            className={`text-left px-3 py-2 text-sm transition-colors font-mono ${
              selected === m
                ? "bg-orange-600/70 text-white"
                : "text-zinc-300 hover:bg-white/[0.05]"
            }`}
          >
            {m}
          </button>
        ))}
        {meshes.length === 0 && (
          <p className="px-3 py-4 text-xs text-zinc-600 italic">
            No base meshes found.
          </p>
        )}
      </div>
      <ActionBtn
        icon={<User className="w-3.5 h-3.5" />}
        label="Select"
        variant="primary"
        disabled={!selected}
        onClick={() => onConfirm(selected)}
      />
    </div>
  );
}

// ─── cat 1 : Select skin ──────────────────────────────────────────────────────

export function SkinPanel({
  filter,
  onFilterChange,
  onRefresh,
}: {
  filter: string;
  onFilterChange: (v: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <FieldLabel>Filter</FieldLabel>
        <div className={controlPatterns.input.searchWrapper}>
          <Search className={controlPatterns.input.searchIcon} />
          <input
            type="text"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder="filter skins…"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded pl-7 pr-2 py-1.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-violet-500/40"
          />
        </div>
      </div>
      <p className="text-[10px] text-zinc-600 leading-relaxed">
        Skin thumbnails appear in the right panel. Use the filter to search
        by material name. Click a skin to preview, then press{" "}
        <span className="text-zinc-400">Use</span> to apply.
      </p>
      <ActionBtn
        icon={<RefreshCw className="w-3.5 h-3.5" />}
        label="Refresh list"
        onClick={onRefresh}
      />
    </div>
  );
}

// ─── cat 2 : Load file ────────────────────────────────────────────────────────

export type LoadFilter = "complete" | "targets" | "head";

export function LoadFilePanel({
  filter,
  onFilterChange,
  searchText,
  onSearchChange,
}: {
  filter: LoadFilter;
  onFilterChange: (v: LoadFilter) => void;
  searchText: string;
  onSearchChange: (v: string) => void;
}) {
  const options: { value: LoadFilter; label: string }[] = [
    { value: "complete", label: "Load complete character" },
    { value: "targets", label: "Load only targets" },
    { value: "head", label: "Load only head-targets" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <FieldLabel>Search</FieldLabel>
        <div className={controlPatterns.input.searchWrapper}>
          <Search className={controlPatterns.input.searchIcon} />
          <input
            type="text"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="search characters…"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded pl-7 pr-2 py-1.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-violet-500/40"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <FieldLabel>Load mode</FieldLabel>
        {options.map((o) => (
          <label
            key={o.value}
            className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 hover:text-white"
          >
            <span
              className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                filter === o.value
                  ? "border-violet-500 bg-violet-500"
                  : "border-zinc-600"
              }`}
            >
              {filter === o.value && (
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </span>
            <input
              type="radio"
              className="sr-only"
              checked={filter === o.value}
              onChange={() => onFilterChange(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── cat 3 : Save file ────────────────────────────────────────────────────────

export interface SaveFormData {
  name: string;
  author: string;
  uuid: string;
  tags: string;
  filename: string;
}

export function SaveFilePanel({
  data,
  onChange,
  onSave,
  onThumbnail,
}: {
  data: SaveFormData;
  onChange: (patch: Partial<SaveFormData>) => void;
  onSave: () => void;
  onThumbnail: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {[
        { key: "name" as const, label: "Character name", icon: <User className="w-3 h-3" />, ph: "My character" },
        { key: "author" as const, label: "Author", icon: <User className="w-3 h-3" />, ph: "unknown" },
        { key: "uuid" as const, label: "UUID", icon: <Hash className="w-3 h-3" />, ph: "auto-generated" },
        { key: "tags" as const, label: "Tags", icon: <Tag className="w-3 h-3" />, ph: "tag1, tag2…" },
        { key: "filename" as const, label: "Filename", icon: <FileText className="w-3 h-3" />, ph: "character.mhm" },
      ].map(({ key, label, icon, ph }) => (
        <div key={key} className="flex flex-col gap-1">
          <FieldLabel>{label}</FieldLabel>
          <div className="relative flex items-center">
            <span className="absolute left-2 text-zinc-600">{icon}</span>
            <TextInput
              value={data[key]}
              onChange={(v) => onChange({ [key]: v })}
              placeholder={ph}
            />
          </div>
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <ActionBtn
          icon={<Save className="w-3.5 h-3.5" />}
          label="Save"
          variant="primary"
          onClick={onSave}
        />
        <ActionBtn
          icon={<Upload className="w-3.5 h-3.5" />}
          label="Thumbnail"
          onClick={onThumbnail}
        />
      </div>
    </div>
  );
}

// ─── cat 4 : Export file ──────────────────────────────────────────────────────

export type ExportType = ".glb" | ".gltf" | ".obj" | ".stl" | ".bvh";

export interface ExportFormData {
  exportFolder: string;
  textureFolder: string;
  filename: string;
  exportType: ExportType;
  scaleIndex: number;
  binaryMode: boolean;
  packTextures: boolean;
  feetOnGround: boolean;
  characterPosed: boolean;
  saveHiddenVerts: boolean;
  saveAnimation: boolean;
  saveHelper: boolean;
  normals: boolean;
}

export const DEFAULT_EXPORT_FORM: ExportFormData = {
  exportFolder: "~/exports",
  textureFolder: "textures",
  filename: "",
  exportType: ".glb",
  scaleIndex: 0,
  binaryMode: true,
  packTextures: false,
  feetOnGround: true,
  characterPosed: false,
  saveHiddenVerts: false,
  saveAnimation: false,
  saveHelper: false,
  normals: true,
};

const SCALE_ITEMS = [
  { value: 0.1, label: "0.1   Meter" },
  { value: 1.0, label: "1.0   Decimeter" },
  { value: 3.937, label: "3.937 Inch" },
  { value: 10.0, label: "10.0  Centimeter" },
  { value: 100.0, label: "100.0 Millimeter" },
];

const EXPORT_TYPES: ExportType[] = [".glb", ".gltf", ".obj", ".stl", ".bvh"];

export function ExportPanel({
  data,
  onChange,
  onExport,
}: {
  data: ExportFormData;
  onChange: (patch: Partial<ExportFormData>) => void;
  onExport: () => void;
}) {
  const isGltf = data.exportType === ".glb" || data.exportType === ".gltf";

  return (
    <div className="flex flex-col gap-3">

      <div className="flex flex-col gap-1">
        <FieldLabel>Export folder</FieldLabel>
        <div className="flex gap-1">
          <TextInput
            value={data.exportFolder}
            onChange={(v) => onChange({ exportFolder: v })}
            placeholder="~/exports"
          />
          <button
            className="px-2 py-1.5 rounded bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.09] transition-colors"
            title="Select folder"
          >
            <FolderOpen className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <FieldLabel>Texture folder (inside export folder)</FieldLabel>
        <TextInput
          value={data.textureFolder}
          onChange={(v) => onChange({ textureFolder: v })}
          placeholder="textures"
        />
      </div>

      <div className="flex flex-col gap-1">
        <FieldLabel>Filename</FieldLabel>
        <TextInput
          value={data.filename}
          onChange={(v) => onChange({ filename: v })}
          placeholder="character"
        />
      </div>

      <div className="flex flex-col gap-1">
        <FieldLabel>Export type</FieldLabel>
        <div className="flex flex-wrap gap-1">
          {EXPORT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => onChange({ exportType: t })}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                data.exportType === t
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
          <div className="relative">
            <select
              value={data.scaleIndex}
              onChange={(e) => onChange({ scaleIndex: Number(e.target.value) })}
              className={`${controlPatterns.select.base} appearance-none`}
            >
              {SCALE_ITEMS.map((s, i) => (
                <option key={i} value={i}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5 pt-1 border-t border-white/[0.06]">
        {isGltf && (
          <>
            <Checkbox label="binary mode" checked={data.binaryMode} onChange={(v) => onChange({ binaryMode: v })} />
            <Checkbox label="pack textures into file" checked={data.packTextures} onChange={(v) => onChange({ packTextures: v })} />
          </>
        )}
        <Checkbox label="feet on ground" checked={data.feetOnGround} onChange={(v) => onChange({ feetOnGround: v })} />
        <Checkbox
          label="character posed"
          checked={data.characterPosed}
          onChange={(v) => onChange({ characterPosed: v })}
          tooltip="Export character posed instead of default pose"
        />
        <Checkbox label="save hidden vertices" checked={data.saveHiddenVerts} onChange={(v) => onChange({ saveHiddenVerts: v })} />
        {isGltf && (
          <Checkbox
            label="save animation"
            checked={data.saveAnimation}
            onChange={(v) => onChange({ saveAnimation: v })}
            tooltip="Append animation to export. Skeleton and animation must be selected."
          />
        )}
        <Checkbox
          label="save helper"
          checked={data.saveHelper}
          onChange={(v) => onChange({ saveHelper: v })}
          tooltip="For special purposes the invisible helper can be exported"
        />
        {(data.exportType === ".obj") && (
          <Checkbox label="normals" checked={data.normals} onChange={(v) => onChange({ normals: v })} />
        )}
      </div>

      <ActionBtn
        icon={<Upload className="w-3.5 h-3.5" />}
        label="Export"
        variant="primary"
        onClick={onExport}
      />
    </div>
  );
}

// ─── cat 5 : Download / Import ────────────────────────────────────────────────

export function DownloadPanel({
  assetListDate,
  onDownloadList,
  onBrowse,
  onDownloadPack,
  onExtract,
  onCleanup,
  hasAssetList,
  packUrl,
  onPackUrlChange,
  zipFilename,
  onZipFilenameChange,
}: {
  assetListDate: string | null;
  onDownloadList: () => void;
  onBrowse: () => void;
  onDownloadPack: () => void;
  onExtract: () => void;
  onCleanup: () => void;
  hasAssetList: boolean;
  packUrl: string;
  onPackUrlChange: (v: string) => void;
  zipFilename: string;
  onZipFilenameChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">

      {/* Asset list */}
      <div className="flex flex-col gap-2">
        <ActionBtn
          icon={<Download className="w-3.5 h-3.5" />}
          label={
            assetListDate
              ? `Replace Current Asset Lists [${assetListDate}]`
              : "Download Asset and Assetpack list"
          }
          onClick={onDownloadList}
        />
        <p className="text-[10px] text-zinc-600 leading-relaxed">
          Asset lists are needed to load single assets or asset packs. This must
          be done once.
        </p>
      </div>

      {/* Single asset */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
        <FieldLabel>Single Asset</FieldLabel>
        <p className="text-[10px] text-zinc-500">Browse in list to find your asset.</p>
        <ActionBtn
          icon={<Search className="w-3.5 h-3.5" />}
          label="Asset Browser"
          disabled={!hasAssetList}
          onClick={onBrowse}
        />
      </div>

      {/* Asset pack */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
        <FieldLabel>Asset Pack</FieldLabel>
        <p className="text-[10px] text-zinc-500">
          Enter or paste an asset pack URL (http/https/ftp):
        </p>
        <TextInput
          value={packUrl}
          onChange={onPackUrlChange}
          placeholder="https://…/assetpack.zip"
        />
        <ActionBtn
          icon={<Download className="w-3.5 h-3.5" />}
          label="Download Asset Pack"
          disabled={!packUrl.startsWith("http")}
          onClick={onDownloadPack}
        />
      </div>

      {/* Extract */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
        <FieldLabel>Extract</FieldLabel>
        <TextInput
          value={zipFilename}
          onChange={onZipFilenameChange}
          placeholder="/tmp/assetpack.zip"
        />
        <div className="flex gap-2">
          <ActionBtn
            icon={<Upload className="w-3.5 h-3.5" />}
            label="Extract"
            disabled={!zipFilename.endsWith(".zip")}
            onClick={onExtract}
          />
          <ActionBtn
            icon={<Trash2 className="w-3.5 h-3.5" />}
            label="Clean Up"
            variant="danger"
            onClick={onCleanup}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

/**
 * Left panel – category icon strip + panel content.
 * Mirrors the left column of MHMainWindow exactly.
 *
 * Tool modes:
 *   0 = Files       6 category buttons
 *   1 = Modelling   2 category buttons
 *   2 = Equipment   8 category buttons
 *   3 = Pose        6 category buttons
 *   4 = Render      1 category button
 */

import { panelPatterns, buttonPatterns, typographyPatterns, controlPatterns } from "@/lib/patterns";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  User, Palette, FolderOpen, Save, Upload, Download,
  Ruler, Shuffle, Shirt, Wind, Eye, EyeOff, Smile,
  Mic2, Grid3x3, Bone, PersonStanding, Play, Edit3, Laugh,
  Camera, Wifi, WifiOff, CheckCircle2, XCircle,
} from "lucide-react";

import type { ToolMode } from "./Toolbar";
import type { ConnectionStatus } from "./Viewport";

// Panel components
import {
  BaseMeshPanel, SkinPanel, LoadFilePanel, SaveFilePanel,
  ExportPanel, DownloadPanel,
  type SaveFormData, type ExportFormData, type LoadFilter,
  DEFAULT_EXPORT_FORM,
} from "@/components/panels/FilesPanels";
import {
  ModellingPanel, RandomizePanel,
  type RandomizeValues, DEFAULT_RANDOMIZE_VALUES,
} from "@/components/panels/ModellingPanels";
import { EquipmentPanel, type EquipmentItem } from "@/components/panels/EquipmentPanel";
import {
  RigsPanel, PosesPanel, AnimPlayerPanel, ExpressionsPanel,
  ExpressionEditorPanel, PoseEditorPanel,
  type AnimPlayerState, DEFAULT_ANIM_PLAYER,
} from "@/components/panels/PosePanels";
import { RenderPanel, type RendererValues, DEFAULT_RENDERER_VALUES } from "@/components/panels/RenderPanel";

// ─── Category icon definitions ────────────────────────────────────────────────

const CATEGORIES: { icon: React.ReactNode; tip: string; id: string }[][] = [
  // Mode 0 – Files
  [
    { icon: <User className="w-4 h-4" />, tip: "Select basemesh", id: "basemesh" },
    { icon: <Palette className="w-4 h-4" />, tip: "Change skin", id: "skin" },
    { icon: <FolderOpen className="w-4 h-4" />, tip: "Load character", id: "load" },
    { icon: <Save className="w-4 h-4" />, tip: "Save character", id: "save" },
    { icon: <Upload className="w-4 h-4" />, tip: "Export character", id: "export" },
    { icon: <Download className="w-4 h-4" />, tip: "Download assets", id: "download" },
  ],
  // Mode 1 – Modelling
  [
    { icon: <Ruler className="w-4 h-4" />, tip: "Modelling by category", id: "model" },
    { icon: <Shuffle className="w-4 h-4" />, tip: "Randomize character", id: "random" },
  ],
  // Mode 2 – Equipment
  [
    { icon: <Shirt className="w-4 h-4" />, tip: "Clothes", id: "clothes" },
    { icon: <Wind className="w-4 h-4" />, tip: "Hair", id: "hair" },
    { icon: <Eye className="w-4 h-4" />, tip: "Eyes", id: "eyes" },
    { icon: <EyeOff className="w-4 h-4" />, tip: "Eyebrows", id: "eyebrows" },
    { icon: <Laugh className="w-4 h-4" />, tip: "Eyelashes", id: "eyelashes" },
    { icon: <Smile className="w-4 h-4" />, tip: "Teeth", id: "teeth" },
    { icon: <Mic2 className="w-4 h-4" />, tip: "Tongue", id: "tongue" },
    { icon: <Grid3x3 className="w-4 h-4" />, tip: "Topology / Proxies", id: "proxy" },
  ],
  // Mode 3 – Pose
  [
    { icon: <Bone className="w-4 h-4" />, tip: "Skeleton / Rig", id: "rig" },
    { icon: <PersonStanding className="w-4 h-4" />, tip: "Load pose or animation", id: "pose" },
    { icon: <Play className="w-4 h-4" />, tip: "Play animation", id: "anim" },
    { icon: <Smile className="w-4 h-4" />, tip: "Expressions", id: "expression" },
    { icon: <Edit3 className="w-4 h-4" />, tip: "Expression editor", id: "expreditor" },
    { icon: <PersonStanding className="w-4 h-4" />, tip: "Pose editor", id: "poseeditor" },
  ],
  // Mode 4 – Render
  [
    { icon: <Camera className="w-4 h-4" />, tip: "Renderer", id: "renderer" },
  ],
];

// Equipment type labels for display
const EQUIP_LABELS = ["clothes", "hair", "eyes", "eyebrows", "eyelashes", "teeth", "tongue", "proxy"];

// ─── Panel dispatch ───────────────────────────────────────────────────────────

interface PanelState {
  // Files
  meshes: string[];
  selectedMesh: string;
  skinFilter: string;
  loadFilter: LoadFilter;
  loadSearch: string;
  saveForm: SaveFormData;
  exportForm: ExportFormData;
  assetListDate: string | null;
  packUrl: string;
  zipFilename: string;
  // Modelling
  selectedMorphCat: string;
  symActive: boolean;
  randomValues: RandomizeValues;
  // Equipment
  equipFilters: Record<string, string>;
  equipItems: Record<string, EquipmentItem[]>;
  selectedEquipItems: Record<string, string>;
  // Pose
  rigFilter: string;
  poseFilter: string;
  exprFilter: string;
  selectedRig: string;
  selectedPose: string;
  selectedExpr: string;
  animPlayer: AnimPlayerState;
  exprEditorCat: string;
  exprUnits: { name: string; value: number }[];
  poseEditorCat: string;
  poseUnits: { name: string; value: number }[];
  // Render
  rendererValues: RendererValues;
}

function initState(meshes: string[]): PanelState {
  return {
    meshes,
    selectedMesh: meshes[0] ?? "",
    skinFilter: "",
    loadFilter: "complete",
    loadSearch: "",
    saveForm: { name: "", author: "unknown", uuid: "", tags: "", filename: "" },
    exportForm: DEFAULT_EXPORT_FORM,
    assetListDate: null,
    packUrl: "",
    zipFilename: "",
    selectedMorphCat: "",
    symActive: false,
    randomValues: DEFAULT_RANDOMIZE_VALUES,
    equipFilters: Object.fromEntries(EQUIP_LABELS.map((l) => [l, ""])),
    equipItems: Object.fromEntries(EQUIP_LABELS.map((l) => [l, []])),
    selectedEquipItems: Object.fromEntries(EQUIP_LABELS.map((l) => [l, ""])),
    rigFilter: "",
    poseFilter: "",
    exprFilter: "",
    selectedRig: "",
    selectedPose: "",
    selectedExpr: "",
    animPlayer: DEFAULT_ANIM_PLAYER,
    exprEditorCat: "",
    exprUnits: [],
    poseEditorCat: "",
    poseUnits: [],
    rendererValues: DEFAULT_RENDERER_VALUES,
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface LeftPanelProps {
  toolMode: ToolMode;
  categoryMode: number;
  onCategoryChange: (mode: number) => void;
  status: ConnectionStatus;
  baseMeshes: string[];
  onRandomize: (mode?: number) => void;
  onGetChar: () => void;
  loadingRandomize: boolean;
  characterName: string;
  host: string;
  port: number;
  onHostChange: (h: string) => void;
  onPortChange: (p: number) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  loadingConnect: boolean;
  connectionError: string | null;
  onExportChange: (patch: Partial<ExportFormData>) => void;
  exportData: ExportFormData;
}

// ─── LeftPanel ────────────────────────────────────────────────────────────────

export function LeftPanel({
  toolMode,
  categoryMode,
  onCategoryChange,
  status,
  baseMeshes,
  onRandomize,
  onGetChar,
  loadingRandomize,
  characterName,
  host,
  port,
  onHostChange,
  onPortChange,
  onConnect,
  onDisconnect,
  loadingConnect,
  connectionError,
  onExportChange,
  exportData,
}: LeftPanelProps) {
  const [state, setState] = useState<PanelState>(() => initState(baseMeshes));

  // Sync meshes when baseMeshes changes
  useEffect(() => {
    setState((s) => ({
      ...s,
      meshes: baseMeshes,
      selectedMesh: s.selectedMesh || baseMeshes[0] || "",
    }));
  }, [baseMeshes]);

  const patch = (p: Partial<PanelState>) => setState((s) => ({ ...s, ...p }));

  const cats = CATEGORIES[toolMode];
  const catId = cats[Math.min(categoryMode, cats.length - 1)]?.id ?? "";
  const connected = status === "connected";

  function renderPanel() {
    if (!connected && toolMode !== 0) {
      return (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <WifiOff className="w-6 h-6 text-zinc-600" />
          <p className={typographyPatterns.muted}>
            Connect to MakeHuman 2 to use this panel.
          </p>
        </div>
      );
    }

    // ── Mode 0: Files ──
    if (toolMode === 0) {
      switch (catId) {
        case "basemesh":
          return (
            <BaseMeshPanel
              meshes={state.meshes}
              selected={state.selectedMesh}
              onSelect={(m) => patch({ selectedMesh: m })}
              onConfirm={(m) => patch({ selectedMesh: m })}
            />
          );
        case "skin":
          return (
            <SkinPanel
              filter={state.skinFilter}
              onFilterChange={(v) => patch({ skinFilter: v })}
              onRefresh={onGetChar}
            />
          );
        case "load":
          return (
            <LoadFilePanel
              filter={state.loadFilter}
              onFilterChange={(v) => patch({ loadFilter: v })}
              searchText={state.loadSearch}
              onSearchChange={(v) => patch({ loadSearch: v })}
            />
          );
        case "save":
          return (
            <SaveFilePanel
              data={state.saveForm}
              onChange={(p) => patch({ saveForm: { ...state.saveForm, ...p } })}
              onSave={() => { }}
              onThumbnail={() => { }}
            />
          );
        case "export":
          return (
            <ExportPanel
              data={exportData}
              onChange={onExportChange}
              onExport={() => { }}
            />
          );
        case "download":
          return (
            <DownloadPanel
              assetListDate={state.assetListDate}
              onDownloadList={() => { }}
              onBrowse={() => { }}
              onDownloadPack={() => { }}
              onExtract={() => { }}
              onCleanup={() => { }}
              hasAssetList={!!state.assetListDate}
              packUrl={state.packUrl}
              onPackUrlChange={(v) => patch({ packUrl: v })}
              zipFilename={state.zipFilename}
              onZipFilenameChange={(v) => patch({ zipFilename: v })}
            />
          );
        default:
          return null;
      }
    }

    // ── Mode 1: Modelling ──
    if (toolMode === 1) {
      if (catId === "model") {
        return (
          <ModellingPanel
            selectedCategory={state.selectedMorphCat}
            onSelectCategory={(c) => patch({ selectedMorphCat: c })}
            symActive={state.symActive}
            onReset={() => { }}
            onSymRtoL={() => { }}
            onSymLtoR={() => { }}
            onSymToggle={() => patch({ symActive: !state.symActive })}
          />
        );
      }
      if (catId === "random") {
        return (
          <RandomizePanel
            values={state.randomValues}
            onChange={(p) => patch({ randomValues: { ...state.randomValues, ...p } })}
            onApply={() => onRandomize(state.randomValues.gender)}
            loading={loadingRandomize}
          />
        );
      }
    }

    // ── Mode 2: Equipment ──
    if (toolMode === 2) {
      const equipIdx = EQUIP_LABELS.indexOf(catId);
      const label = EQUIP_LABELS[Math.max(0, equipIdx)];
      return (
        <EquipmentPanel
          equipType={label}
          filter={state.equipFilters[label] ?? ""}
          onFilterChange={(v) =>
            patch({ equipFilters: { ...state.equipFilters, [label]: v } })
          }
          items={state.equipItems[label] ?? []}
          selectedItem={state.selectedEquipItems[label] ?? ""}
          onSelectItem={(n) =>
            patch({ selectedEquipItems: { ...state.selectedEquipItems, [label]: n } })
          }
          onUse={() => { }}
          onRemove={() => { }}
          onInfo={() => { }}
          onRefresh={onGetChar}
        />
      );
    }

    // ── Mode 3: Pose ──
    if (toolMode === 3) {
      switch (catId) {
        case "rig":
          return (
            <RigsPanel
              filter={state.rigFilter}
              onFilterChange={(v) => patch({ rigFilter: v })}
              rigs={[]}
              selectedRig={state.selectedRig}
              onSelectRig={(r) => patch({ selectedRig: r })}
              onLoad={() => { }}
            />
          );
        case "pose":
          return (
            <PosesPanel
              filter={state.poseFilter}
              onFilterChange={(v) => patch({ poseFilter: v })}
              poses={[]}
              selectedPose={state.selectedPose}
              onSelectPose={(p) => patch({ selectedPose: p })}
              onLoad={() => { }}
            />
          );
        case "anim":
          return (
            <AnimPlayerPanel
              state={state.animPlayer}
              onChange={(p) =>
                patch({ animPlayer: { ...state.animPlayer, ...p } })
              }
              onFirst={() => patch({ animPlayer: { ...state.animPlayer, currentFrame: 0 } })}
              onPrev={() =>
                patch({
                  animPlayer: {
                    ...state.animPlayer,
                    currentFrame: Math.max(0, state.animPlayer.currentFrame - 1),
                  },
                })
              }
              onNext={() =>
                patch({
                  animPlayer: {
                    ...state.animPlayer,
                    currentFrame: Math.min(
                      state.animPlayer.frameCount - 1,
                      state.animPlayer.currentFrame + 1
                    ),
                  },
                })
              }
              onLast={() =>
                patch({
                  animPlayer: {
                    ...state.animPlayer,
                    currentFrame: Math.max(0, state.animPlayer.frameCount - 1),
                  },
                })
              }
              onToggleLoop={() =>
                patch({
                  animPlayer: { ...state.animPlayer, looping: !state.animPlayer.looping },
                })
              }
            />
          );
        case "expression":
          return (
            <ExpressionsPanel
              filter={state.exprFilter}
              onFilterChange={(v) => patch({ exprFilter: v })}
              expressions={[]}
              selectedExpr={state.selectedExpr}
              onSelectExpr={(e) => patch({ selectedExpr: e })}
              onLoad={() => { }}
            />
          );
        case "expreditor":
          return (
            <ExpressionEditorPanel
              selectedCat={state.exprEditorCat}
              onSelectCat={(c) => patch({ exprEditorCat: c })}
              units={state.exprUnits}
              onUnitChange={(name, val) =>
                patch({
                  exprUnits: state.exprUnits.map((u) =>
                    u.name === name ? { ...u, value: val } : u
                  ),
                })
              }
              onSave={() => { }}
              onLoad={() => { }}
            />
          );
        case "poseeditor":
          return (
            <PoseEditorPanel
              selectedCat={state.poseEditorCat}
              onSelectCat={(c) => patch({ poseEditorCat: c })}
              units={state.poseUnits}
              onUnitChange={(name, val) =>
                patch({
                  poseUnits: state.poseUnits.map((u) =>
                    u.name === name ? { ...u, value: val } : u
                  ),
                })
              }
              onSave={() => { }}
              onLoad={() => { }}
              onReset={() => patch({ poseUnits: state.poseUnits.map((u) => ({ ...u, value: 0 })) })}
            />
          );
        default:
          return null;
      }
    }

    // ── Mode 4: Render ──
    if (toolMode === 4) {
      return (
        <RenderPanel
          values={state.rendererValues}
          onChange={(p) =>
            patch({ rendererValues: { ...state.rendererValues, ...p } })
          }
          onRender={() => { }}
          onSaveImage={() => { }}
          onViewImage={() => { }}
          hasAnimation={false}
          loading={false}
        />
      );
    }

    return null;
  }

  return (
    <div className={`w-56 shrink-0 flex flex-col overflow-hidden ${panelPatterns.containerLeft}`}>
      {/* Category strip */}
      <div className={panelPatterns.left.categoryBar}>
        {cats.map((cat, i) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(i)}
            title={cat.tip}
            className={`${panelPatterns.left.categoryButton} ${
              categoryMode === i
                ? panelPatterns.left.categoryActive
                : panelPatterns.left.categoryInactive
            }`}
          >
            {cat.icon}
          </button>
        ))}
      </div>

      {/* Title bar */}
      <div className={panelPatterns.titleBar}>
        <p className={panelPatterns.titleText}>
          {getPanelTitle(toolMode, categoryMode)}
        </p>
      </div>

      {/* Panel content */}
      <div className={panelPatterns.content}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${toolMode}-${catId}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.12 }}
          >
            {renderPanel()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Connection mini-panel */}
      <div className={panelPatterns.left.connectionBar}>
        {!connected ? (
          <>
            <div className="flex gap-1">
              <input
                type="text"
                value={host}
                onChange={(e) => onHostChange(e.target.value)}
                className={`flex-1 w-0 ${controlPatterns.input.base}`}
                placeholder="127.0.0.1"
              />
              <input
                type="number"
                value={port}
                onChange={(e) => onPortChange(Number(e.target.value))}
                className={`w-16 ${controlPatterns.input.base}`}
                placeholder="12345"
              />
            </div>
            <button
              onClick={onConnect}
              disabled={loadingConnect || status === "connecting"}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded ${buttonPatterns.primary}`}
            >
              <Wifi className="w-3 h-3" />
              {status === "connecting" ? "Connecting…" : "Connect"}
            </button>
            {connectionError && (
              <div className={`flex items-start gap-1 ${typographyPatterns.error}`}>
                <XCircle className="w-3 h-3 shrink-0 mt-0.5" />
                <span className="break-all leading-tight">{connectionError}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className={`flex items-center gap-1.5 ${typographyPatterns.success}`}>
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span className="truncate">{characterName || "Connected"}</span>
            </div>
            <button
              onClick={onDisconnect}
              className={`px-3 py-1 rounded ${buttonPatterns.danger}`}
            >
              Disconnect
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Panel title mapping ──────────────────────────────────────────────────────

function getPanelTitle(toolMode: ToolMode, catMode: number): string {
  const titles: Record<number, string[]> = {
    0: [
      "Base mesh :: selection",
      "Select skin :: parameters",
      "Load file :: filter",
      "Save file :: parameters",
      "Export file :: parameters",
      "Import file :: parameters",
    ],
    1: ["Modify character :: categories", "Random character :: parameters"],
    2: ["Character equipment :: filter"],
    3: [
      "Rigs :: filter",
      "Poses :: filter",
      "Animation Player",
      "Expressions :: filter",
      "Expressions :: editor",
      "Pose :: editor",
    ],
    4: ["Rendering :: parameters"],
  };
  return titles[toolMode]?.[Math.min(catMode, (titles[toolMode]?.length ?? 1) - 1)] ?? "Panel";
}

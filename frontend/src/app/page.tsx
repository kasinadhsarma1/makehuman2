"use client";

/**
 * MakeHuman 2 – Main Desktop Window
 *
 * Layout mirrors MHMainWindow exactly:
 *   MenuBar → Toolbar → [LeftPanel | Viewport + NavButtons | ContextPanel] → StatusBar
 *
 * Connects to the Python/PySide6 core via window.mh (Electron IPC → TCP socket).
 */

import { useCallback, useState } from "react";
import { MenuBar, type MenuBarCallbacks } from "@/components/layout/MenuBar";
import { Toolbar, type ToolMode } from "@/components/layout/Toolbar";
import { LeftPanel } from "@/components/layout/LeftPanel";
import { Viewport, type ConnectionStatus } from "@/components/layout/Viewport";
import { RightPanel, DEFAULT_VIEW_STATE, type ViewState } from "@/components/layout/RightPanel";
import { ContextPanel, DEFAULT_CONTEXT_STATE, type ContextPanelState } from "@/components/layout/ContextPanel";
import { StatusBar } from "@/components/layout/StatusBar";
import { DEFAULT_EXPORT_FORM, type ExportFormData } from "@/components/panels/FilesPanels";

// ─── Electron IPC bridge types ────────────────────────────────────────────────

declare global {
  interface Window {
    mh?: {
      hello:        (o?: { host?: string; port?: number })                               => Promise<{ ok: boolean; data?: { application: string; name: string }; error?: string }>;
      getChar:      (o?: { host?: string; port?: number })                               => Promise<{ ok: boolean; data?: object; error?: string }>;
      randomize:    (o?: { host?: string; port?: number; mode?: number })                => Promise<{ ok: boolean; error?: string }>;
      getBinaryChar:(o?: { host?: string; port?: number })                               => Promise<{ ok: boolean; data?: { byteLength: number }; error?: string }>;
    };
  }
}

const KNOWN_BASE_MESHES = ["hm08", "mh2bot"];

// ─── App ──────────────────────────────────────────────────────────────────────

export default function Home() {
  // ── Connection ─────────────────────────────────────────────────────────────
  const [host, setHost]               = useState("127.0.0.1");
  const [port, setPort]               = useState(12345);
  const [status, setStatus]           = useState<ConnectionStatus>("disconnected");
  const [appName, setAppName]         = useState("");
  const [characterName, setCharName]  = useState("");
  const [connectionError, setConnErr] = useState<string | null>(null);
  const [loadingConnect, setLoadConn] = useState(false);

  // ── Character / char data ──────────────────────────────────────────────────
  const [charJsonKeys, setCharJsonKeys]         = useState<string[]>([]);
  const [loadingRandomize, setLoadRandomize]    = useState(false);
  const [loadingGetChar, setLoadGetChar]        = useState(false);

  // ── UI mode ────────────────────────────────────────────────────────────────
  const [toolMode, setToolMode]         = useState<ToolMode>(0);
  const [categoryMode, setCategoryMode] = useState(0);
  const [viewState, setViewState]       = useState<ViewState>(DEFAULT_VIEW_STATE);

  // ── Export form (shared between LeftPanel and ContextPanel) ───────────────
  const [exportData, setExportData] = useState<ExportFormData>(DEFAULT_EXPORT_FORM);
  const handleExportChange = useCallback((patch: Partial<ExportFormData>) => {
    setExportData((d) => ({ ...d, ...patch }));
  }, []);

  // ── Context panel state ───────────────────────────────────────────────────
  const [ctxState, setCtxState] = useState<ContextPanelState>(DEFAULT_CONTEXT_STATE);
  const patchCtx = useCallback((patch: Partial<ContextPanelState>) => {
    setCtxState((s) => ({ ...s, ...patch }));
  }, []);

  // ── Activate toggles ───────────────────────────────────────────────────────
  const [socketActive,      setSocketActive]      = useState(false);
  const [diamondSkeleton,   setDiamondSkeleton]   = useState(false);
  const [floorInsteadOfGrid, setFloorInsteadOfGrid] = useState(false);
  const [displayCameraPos,  setDisplayCameraPos]  = useState(false);

  // ── Status log ────────────────────────────────────────────────────────────
  const [statusMsg, setStatusMsg] = useState("");

  const connOpts = useCallback(() => ({ host, port }), [host, port]);
  const isElectron = typeof window !== "undefined" && !!window.mh;

  // When tool mode changes, reset category to 0
  const handleToolMode = useCallback((m: ToolMode) => {
    setToolMode(m);
    setCategoryMode(0);
  }, []);

  // ── Connect ────────────────────────────────────────────────────────────────
  const handleConnect = useCallback(async () => {
    if (!isElectron) {
      setConnErr("window.mh unavailable – run via npm run electron:dev");
      setStatus("error");
      return;
    }
    setLoadConn(true);
    setStatus("connecting");
    setConnErr(null);
    setStatusMsg("Connecting…");
    try {
      const res = await window.mh!.hello(connOpts());
      if (res.ok && res.data) {
        setAppName(res.data.application);
        setCharName(res.data.name);
        setStatus("connected");
        setStatusMsg(`Connected – ${res.data.application}`);
      } else {
        setStatus("error");
        setConnErr(res.error ?? "Connection failed");
        setStatusMsg(res.error ?? "Connection failed");
      }
    } catch (e) {
      setStatus("error");
      setConnErr(String(e));
    } finally {
      setLoadConn(false);
    }
  }, [isElectron, connOpts]);

  const handleDisconnect = useCallback(() => {
    setStatus("disconnected");
    setAppName("");
    setCharName("");
    setCharJsonKeys([]);
    setConnErr(null);
    setStatusMsg("Disconnected");
  }, []);

  // ── Get character ──────────────────────────────────────────────────────────
  const handleGetChar = useCallback(async () => {
    if (!isElectron || status !== "connected") return;
    setLoadGetChar(true);
    setStatusMsg("Loading character data…");
    try {
      const res = await window.mh!.getChar(connOpts());
      if (res.ok && res.data) {
        setCharJsonKeys(Object.keys(res.data as object).slice(0, 12));
        setStatusMsg("Character data loaded");
      } else {
        setStatusMsg(res.error ?? "Failed to load character");
      }
    } catch (e) {
      setStatusMsg(String(e));
    } finally {
      setLoadGetChar(false);
    }
  }, [isElectron, status, connOpts]);

  // ── Randomize ──────────────────────────────────────────────────────────────
  const handleRandomize = useCallback(async (mode = 0) => {
    if (!isElectron || status !== "connected") return;
    setLoadRandomize(true);
    setStatusMsg("Randomizing character…");
    try {
      const res = await window.mh!.randomize({ ...connOpts(), mode });
      if (res.ok) {
        setStatusMsg("Character randomized");
        const hello = await window.mh!.hello(connOpts());
        if (hello.ok && hello.data) setCharName(hello.data.name);
      } else {
        setStatusMsg(res.error ?? "Randomize failed");
      }
    } catch (e) {
      setStatusMsg(String(e));
    } finally {
      setLoadRandomize(false);
    }
  }, [isElectron, status, connOpts]);

  // ── View state ─────────────────────────────────────────────────────────────
  const handleViewChange = useCallback((patch: Partial<ViewState>) => {
    setViewState((v) => ({ ...v, ...patch }));
  }, []);

  const handleCameraAction = useCallback(
    (action: "top" | "bottom" | "left" | "right" | "front" | "back") => {
      setStatusMsg(`Camera: ${action} view`);
    }, []
  );

  // ── Menu callbacks ─────────────────────────────────────────────────────────
  const menuCallbacks: MenuBarCallbacks = {
    onInfo:                       () => setStatusMsg("MakeHuman 2 – Open Source 3D Human Modelling"),
    onLoadModel:                  () => { handleToolMode(0); setCategoryMode(2); },
    onSaveModel:                  () => { handleToolMode(0); setCategoryMode(3); },
    onExportModel:                () => { handleToolMode(0); setCategoryMode(4); },
    onDownloadAssets:             () => { handleToolMode(0); setCategoryMode(5); },
    onQuit:                       () => { if (typeof window !== "undefined") window.close?.(); },
    // Settings
    onPreferences:                () => setStatusMsg("Preferences – configure in MakeHuman 2 core"),
    onSceneSettings:              () => setStatusMsg("Scene settings – configure in MakeHuman 2 core"),
    onMessages:                   () => setStatusMsg("Message log"),
    onCreateBinariesUser3d:       () => setStatusMsg("Creating user 3D object binaries…"),
    onCreateBinariesUserTargets:  () => setStatusMsg("Creating user target binaries…"),
    onRegenerateUser3d:           () => setStatusMsg("Regenerating user 3D object binaries…"),
    onBackupUserDB:               () => setStatusMsg("Backup user database…"),
    onRestoreUserDB:              () => setStatusMsg("Restore user database…"),
    // Tools
    onSelectBasemesh:             () => { handleToolMode(0); setCategoryMode(0); },
    onSelectSkin:                 () => { handleToolMode(0); setCategoryMode(1); },
    onModelling:                  () => { handleToolMode(1); setCategoryMode(0); },
    onRandomize:                  () => handleRandomize(0),
    onEquipment:                  (cat) => { handleToolMode(2); setCategoryMode(cat); },
    onAnimation:                  (cat) => { handleToolMode(3); setCategoryMode(cat); },
    // Activate
    socketActive,
    onToggleSocket:               () => setSocketActive((v) => !v),
    diamondSkeleton,
    onToggleDiamondSkeleton:      () => setDiamondSkeleton((v) => !v),
    floorInsteadOfGrid,
    onToggleFloor:                () => setFloorInsteadOfGrid((v) => !v),
    displayCameraPos,
    onToggleCameraPos:            () => setDisplayCameraPos((v) => !v),
    // Information
    onCharacterInfo:              () => { handleGetChar(); setStatusMsg("Fetching character info…"); },
    onMemoryInfo:                 () => setStatusMsg("Memory info – available in MakeHuman 2 core"),
    onLocalOpenGLInfo:            () => setStatusMsg("Local OpenGL information – available in MakeHuman 2 core"),
    onUsedLibraryVersions:        () => setStatusMsg("Library versions – available in MakeHuman 2 core"),
    onLicense:                    () => setStatusMsg("MakeHuman 2 is licensed under AGPL v3"),
    onCredits:                    () => setStatusMsg("MakeHuman 2 – see project credits"),
    // Help
    onContextHelp:                () => setStatusMsg("Context help – hover over controls for tooltips"),
    onShortSummary:               () => setStatusMsg("MakeHuman 2 – 3D human character modelling tool"),
    onNavigation:                 () => setStatusMsg("Navigation: LMB rotate · MMB pan · Scroll zoom"),
    onFileSystem:                 () => setStatusMsg("File system – user data in ~/Documents/MakeHuman2"),
  };

  const windowTitle = characterName ? `MakeHuman II (${characterName})` : "MakeHuman II";

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0a0a0a] text-white">
      {/* Menu bar */}
      <MenuBar cb={menuCallbacks} appName={windowTitle} />

      {/* Mode toolbar */}
      <Toolbar toolMode={toolMode} setToolMode={handleToolMode} />

      {/* Three-column main area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left panel */}
        <LeftPanel
          toolMode={toolMode}
          categoryMode={categoryMode}
          onCategoryChange={setCategoryMode}
          status={status}
          baseMeshes={KNOWN_BASE_MESHES}
          onRandomize={handleRandomize}
          onGetChar={handleGetChar}
          loadingRandomize={loadingRandomize}
          characterName={characterName}
          host={host}
          port={port}
          onHostChange={setHost}
          onPortChange={setPort}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          loadingConnect={loadingConnect}
          connectionError={connectionError}
          onExportChange={handleExportChange}
          exportData={exportData}
        />

        {/* Central viewport */}
        <Viewport
          status={status}
          appName={appName}
          characterName={characterName}
          baseMesh={KNOWN_BASE_MESHES[0]}
          loadingRandomize={loadingRandomize}
          loadingGetChar={loadingGetChar}
          onRandomize={() => handleRandomize(0)}
          onGetChar={handleGetChar}
          charJsonKeys={charJsonKeys}
        />

        {/* Right navigation panel (always visible) */}
        <RightPanel
          viewState={viewState}
          onViewChange={handleViewChange}
          onCameraAction={handleCameraAction}
          onRecalc={() => setStatusMsg("Recalculating normals…")}
          disabled={status !== "connected"}
        />

        {/* Context (ToolBox) panel – conditional visibility */}
        <ContextPanel
          toolMode={toolMode}
          categoryMode={categoryMode}
          state={ctxState}
          onStateChange={patchCtx}
          exportData={exportData}
          onExportDataChange={handleExportChange}
          onUseItem={(type, name) => setStatusMsg(`Use: ${type} – ${name}`)}
          onRemoveItem={(type, name) => setStatusMsg(`Remove: ${type} – ${name}`)}
          onInfoItem={(type, name) => setStatusMsg(`Info: ${type} – ${name}`)}
          onDownloadItem={(type, name) => setStatusMsg(`Download: ${type} – ${name}`)}
          onMorphChange={(name, val) => {
            patchCtx({
              morphTargets: ctxState.morphTargets.map((t) =>
                t.name === name ? { ...t, value: val } : t
              ),
            });
          }}
        />
      </div>

      {/* Status bar */}
      <StatusBar
        status={status}
        characterName={characterName}
        appName={appName}
        logMessage={statusMsg}
      />
    </div>
  );
}

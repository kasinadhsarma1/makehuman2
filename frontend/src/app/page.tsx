"use client";

/**
 * MakeHuman 2 – Main Desktop Window
 *
 * Dual-channel communication:
 *   • Electron IPC bridge (window.mh) → TCP socket to Python/PySide6 core (port 12345)
 *     Used for: real-time connect/hello, randomize (core-side), getBinaryChar
 *   • FastAPI REST client (MhApiClient) → HTTP to Python FastAPI backend (port 8000)
 *     Used for: character CRUD, morphs, assets, skeleton, export, materials
 *
 * The REST backend runs independently of the core; both can be active simultaneously.
 * Either channel can be unavailable without breaking the other.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { MenuBar, type MenuBarCallbacks } from "@/components/layout/MenuBar";
import { Toolbar, type ToolMode } from "@/components/layout/Toolbar";
import { LeftPanel } from "@/components/layout/LeftPanel";
import { Viewport, type ConnectionStatus } from "@/components/layout/Viewport";
import { RightPanel, DEFAULT_VIEW_STATE, type ViewState } from "@/components/layout/RightPanel";
import { ContextPanel, DEFAULT_CONTEXT_STATE, type ContextPanelState } from "@/components/layout/ContextPanel";
import { StatusBar } from "@/components/layout/StatusBar";
import { DEFAULT_EXPORT_FORM, type ExportFormData } from "@/components/panels/FilesPanels";
import { createApiClient, type MhApiClient } from "@/lib/api";

// ─── Electron IPC bridge types ────────────────────────────────────────────────

declare global {
  interface Window {
    mh?: {
      hello: (o?: { host?: string; port?: number }) => Promise<{ ok: boolean; data?: { application: string; name: string }; error?: string }>;
      getChar: (o?: { host?: string; port?: number }) => Promise<{ ok: boolean; data?: object; error?: string }>;
      randomize: (o?: { host?: string; port?: number; mode?: number }) => Promise<{ ok: boolean; error?: string }>;
      getBinaryChar: (o?: { host?: string; port?: number }) => Promise<{ ok: boolean; data?: { byteLength: number }; error?: string }>;
    };
  }
}

// Equipment type index → API asset-type string
const EQUIP_TYPES: Record<number, string> = {
  0: "clothes", 1: "hair", 2: "eyes", 3: "eyebrows",
  4: "eyelashes", 5: "teeth", 6: "tongue", 7: "proxy",
};

const KNOWN_BASE_MESHES = ["hm08", "mh2bot"];
const DEFAULT_API_PORT = 8000;

// ─── App ──────────────────────────────────────────────────────────────────────

export default function Home() {

  // ── Connection (IPC / socket layer) ────────────────────────────────────────
  const [host, setHost] = useState("127.0.0.1");
  const [port, setPort] = useState(12345);
  const [apiPort] = useState(DEFAULT_API_PORT);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [appName, setAppName] = useState("");
  const [characterName, setCharName] = useState("");
  const [connectionError, setConnErr] = useState<string | null>(null);
  const [loadingConnect, setLoadConn] = useState(false);

  // ── REST backend status ────────────────────────────────────────────────────
  const [backendOnline, setBackendOnline] = useState(false);

  // ── REST client (recreated when host changes) ──────────────────────────────
  const api: MhApiClient = useMemo(
    () => createApiClient(host, apiPort),
    [host, apiPort],
  );

  // ── Character / char data ──────────────────────────────────────────────────
  const [charJsonKeys, setCharJsonKeys] = useState<string[]>([]);
  const [loadingRandomize, setLoadRandomize] = useState(false);
  const [loadingGetChar, setLoadGetChar] = useState(false);

  // ── UI mode ────────────────────────────────────────────────────────────────
  const [toolMode, setToolMode] = useState<ToolMode>(0);
  const [categoryMode, setCategoryMode] = useState(0);
  const [viewState, setViewState] = useState<ViewState>(DEFAULT_VIEW_STATE);

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
  const [socketActive, setSocketActive] = useState(false);
  const [diamondSkeleton, setDiamondSkeleton] = useState(false);
  const [floorInsteadOfGrid, setFloorInsteadOfGrid] = useState(false);
  const [displayCameraPos, setDisplayCameraPos] = useState(false);

  // ── Status log ────────────────────────────────────────────────────────────
  const [statusMsg, setStatusMsg] = useState("");

  const isElectron = typeof window !== "undefined" && !!window.mh;
  const connOpts = useCallback(() => ({ host, port }), [host, port]);

  // When tool mode changes, reset category to 0
  const handleToolMode = useCallback((m: ToolMode) => {
    setToolMode(m);
    setCategoryMode(0);
  }, []);

  // ─── REST helpers ──────────────────────────────────────────────────────────

  /** Load character info from REST and push into component state. */
  const loadCharacterFromApi = useCallback(async () => {
    try {
      const char = await api.character.get();
      setCharName(char.name);
      setCharJsonKeys(Object.keys(char).slice(0, 12));
      return char;
    } catch {
      return null;
    }
  }, [api]);

  /** Load morph targets for a category from REST and update ctxState. */
  const loadMorphs = useCallback(async (category?: string) => {
    try {
      const mods = await api.morphs.list(category);
      patchCtx({
        morphTargets: mods.map((m) => ({
          name: m.name,
          value: m.value,
          min: m.min,
          max: m.max,
          group: m.category,
        })),
      });
    } catch {
      // silently ignore if backend unavailable
    }
  }, [api, patchCtx]);

  /** Load assets of a given type (clothes, hair, etc.) and update ctxState. */
  const loadEquipAssets = useCallback(async (equipType: string) => {
    try {
      const items = await api.assets.byType(equipType);
      const equip = await api.assets.equipment();
      const equipped = new Set(
        Object.values(equip)
          .filter(Boolean)
          .map((a) => a!.name)
      );
      patchCtx({
        equipItems: items.map((a) => ({
          name: a.name,
          thumb: a.thumbnail,
          active: equipped.has(a.name),
        })),
      });
    } catch {
      // silently ignore
    }
  }, [api, patchCtx]);

  /** Load skin materials and update ctxState. */
  const loadSkins = useCallback(async () => {
    try {
      const skins = await api.assets.byType("material");
      patchCtx({
        skinItems: skins.map((s) => ({ name: s.name, thumb: s.thumbnail })),
      });
    } catch {
      // silently ignore
    }
  }, [api, patchCtx]);

  /** Load saved MHM character files and update ctxState. */
  const loadCharacterFiles = useCallback(async () => {
    try {
      const chars = await api.character.list();
      patchCtx({
        characterItems: chars.map((c) => ({ name: c.name })),
      });
    } catch {
      // silently ignore
    }
  }, [api, patchCtx]);

  /** Load available rigs/poses/expressions for the pose panel. */
  const loadAnimAssets = useCallback(async (category: number) => {
    try {
      if (category === 0) {
        const rigs = await api.skeleton.list();
        patchCtx({ animItems: rigs.map((r) => ({ name: r })) });
      } else if (category === 1) {
        const poses = await api.skeleton.poses();
        patchCtx({ animItems: poses.map((p) => ({ name: p.name })) });
      } else if (category === 3) {
        // expressions – reuse poses list filtered by name prefix
        const poses = await api.skeleton.poses();
        const exprs = poses.filter((p) => p.name.toLowerCase().startsWith("expr"));
        patchCtx({ animItems: exprs.map((p) => ({ name: p.name })) });
      }
    } catch {
      // silently ignore
    }
  }, [api, patchCtx]);

  // ─── Auto-load data when panel changes ────────────────────────────────────

  useEffect(() => {
    if (!backendOnline) return;
    if (toolMode === 0) {
      if (categoryMode === 1) loadSkins();
      if (categoryMode === 2 || categoryMode === 3) loadCharacterFiles();
    } else if (toolMode === 1 && categoryMode === 0) {
      loadMorphs();
    } else if (toolMode === 2) {
      loadEquipAssets(EQUIP_TYPES[categoryMode] ?? "clothes");
    } else if (toolMode === 3 && [0, 1, 3].includes(categoryMode)) {
      loadAnimAssets(categoryMode);
    }
  }, [
    toolMode, categoryMode, backendOnline,
    loadSkins, loadCharacterFiles, loadMorphs,
    loadEquipAssets, loadAnimAssets,
  ]);

  // ─── Connect ───────────────────────────────────────────────────────────────

  const handleConnect = useCallback(async () => {
    setLoadConn(true);
    setStatus("connecting");
    setConnErr(null);
    setStatusMsg("Connecting…");

    let ipcOk = false;
    let restOk = false;

    // 1. Try Electron IPC (Python core TCP socket)
    if (isElectron) {
      try {
        const res = await window.mh!.hello(connOpts());
        if (res.ok && res.data) {
          setAppName(res.data.application);
          setCharName(res.data.name);
          ipcOk = true;
        } else {
          setConnErr(res.error ?? "IPC connection failed");
        }
      } catch (e) {
        setConnErr(String(e));
      }
    }

    // 2. Try FastAPI REST backend (independent of IPC)
    try {
      const health = await api.health();
      setBackendOnline(true);
      restOk = true;
      if (!ipcOk) {
        // Use REST info as fallback app identity
        const info = await api.info();
        setAppName(info.application);
      }
      setStatusMsg(`REST backend v${health.version} online`);
    } catch {
      setBackendOnline(false);
      if (!ipcOk) {
        setStatusMsg("Backend unreachable – start uvicorn backend.main:app");
      }
    }

    // 3. Set overall connection status
    if (ipcOk || restOk) {
      setStatus("connected");
      setStatusMsg(
        ipcOk && restOk ? "Connected (IPC + REST)"
          : ipcOk ? "Connected (IPC only – REST offline)"
            : "Connected (REST only – core offline)"
      );
      // Load character data from REST
      const char = await loadCharacterFromApi();
      if (char) {
        setCharName(char.name);
        // Eagerly load base mesh list (best-effort)
        api.mesh.baseMeshes().catch(() => {});
      }
    } else {
      setStatus("error");
      setConnErr("Neither IPC core nor REST backend is reachable");
    }

    setLoadConn(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isElectron, connOpts, api, loadCharacterFromApi, patchCtx]);

  const handleDisconnect = useCallback(() => {
    setStatus("disconnected");
    setAppName("");
    setCharName("");
    setCharJsonKeys([]);
    setConnErr(null);
    setBackendOnline(false);
    setCtxState(DEFAULT_CONTEXT_STATE);
    setStatusMsg("Disconnected");
  }, []);

  // ─── Get character ─────────────────────────────────────────────────────────

  const handleGetChar = useCallback(async () => {
    if (status !== "connected") return;
    setLoadGetChar(true);
    setStatusMsg("Loading character data…");
    try {
      // Prefer REST
      if (backendOnline) {
        const char = await api.character.get();
        setCharName(char.name);
        setCharJsonKeys(Object.keys(char).slice(0, 12));
        setStatusMsg(`Character: ${char.name} | ${char.modifier_count} modifiers`);
      } else if (isElectron) {
        // Fallback to IPC
        const res = await window.mh!.getChar(connOpts());
        if (res.ok && res.data) {
          setCharJsonKeys(Object.keys(res.data as object).slice(0, 12));
          setStatusMsg("Character data loaded (IPC)");
        } else {
          setStatusMsg(res.error ?? "Failed to load character");
        }
      }
    } catch (e) {
      setStatusMsg(String(e));
    } finally {
      setLoadGetChar(false);
    }
  }, [status, backendOnline, api, isElectron, connOpts]);

  // ─── Randomize ─────────────────────────────────────────────────────────────

  const handleRandomize = useCallback(async (mode = 0) => {
    if (status !== "connected") return;
    setLoadRandomize(true);
    setStatusMsg("Randomizing character…");
    try {
      if (backendOnline) {
        // REST path
        const char = await api.character.randomize({ mode });
        setCharName(char.name);
        setCharJsonKeys(Object.keys(char).slice(0, 12));
        setStatusMsg(`Randomized → ${char.name}`);
        // Reload morphs if the modelling panel is open
        if (toolMode === 1) loadMorphs();
      } else if (isElectron) {
        // IPC fallback
        const res = await window.mh!.randomize({ ...connOpts(), mode });
        if (res.ok) {
          setStatusMsg("Character randomized (IPC)");
          const hello = await window.mh!.hello(connOpts());
          if (hello.ok && hello.data) setCharName(hello.data.name);
        } else {
          setStatusMsg(res.error ?? "Randomize failed");
        }
      }
    } catch (e) {
      setStatusMsg(String(e));
    } finally {
      setLoadRandomize(false);
    }
  }, [status, backendOnline, api, isElectron, connOpts, toolMode, loadMorphs]);

  // ─── Morph change ──────────────────────────────────────────────────────────

  const handleMorphChange = useCallback(async (name: string, val: number) => {
    // Update local state immediately for responsiveness
    patchCtx({
      morphTargets: ctxState.morphTargets.map((t) =>
        t.name === name ? { ...t, value: val } : t
      ),
    });
    // Fire REST call if backend is online
    if (backendOnline) {
      try {
        await api.morphs.set(name, val);
      } catch {
        // silently ignore – local state already updated
      }
    }
  }, [backendOnline, api, ctxState.morphTargets, patchCtx]);

  // ─── Item actions (use / remove / info / download) ─────────────────────────

  const handleUseItem = useCallback(async (type: string, name: string) => {
    setStatusMsg(`Applying ${type}: ${name}…`);
    if (!backendOnline) { setStatusMsg(`Use: ${type} – ${name} (offline)`); return; }
    try {
      if (type === "skin") {
        await api.assets.setSkin(name);
        setStatusMsg(`Skin applied: ${name}`);
      } else if (type === "character") {
        const char = await api.character.load(name);
        setCharName(char.name);
        setStatusMsg(`Character loaded: ${char.name}`);
      } else if (type === "anim") {
        await api.skeleton.setPose(name);
        setStatusMsg(`Pose applied: ${name}`);
      } else {
        // equipment types
        const equipType = Object.entries(EQUIP_TYPES).find(([, v]) => v === type)?.[1] ?? type;
        await api.assets.apply(equipType, name);
        await loadEquipAssets(type);
        setStatusMsg(`Equipped: ${name}`);
      }
    } catch (e) {
      setStatusMsg(String(e));
    }
  }, [backendOnline, api, loadEquipAssets]);

  const handleRemoveItem = useCallback(async (type: string, name: string) => {
    setStatusMsg(`Removing ${type}: ${name}…`);
    if (!backendOnline) { setStatusMsg(`Remove: ${type} – ${name} (offline)`); return; }
    try {
      await api.assets.remove(type, name);
      await loadEquipAssets(type);
      setStatusMsg(`Removed: ${name}`);
    } catch (e) {
      setStatusMsg(String(e));
    }
  }, [backendOnline, api, loadEquipAssets]);

  // ─── Export ────────────────────────────────────────────────────────────────

  const handleExport = useCallback(async () => {
    if (!backendOnline) { setStatusMsg("Export failed – REST backend offline"); return; }
    const outputPath = `${exportData.exportFolder}/${exportData.filename || "character"}${exportData.exportType}`;
    const req = {
      output_path: outputPath,
      scale: exportData.scaleIndex,
      binary: exportData.binaryMode,
      pack_textures: exportData.packTextures,
      feet_on_ground: exportData.feetOnGround,
      posed: exportData.characterPosed,
    };
    setStatusMsg(`Exporting ${exportData.exportType}…`);
    try {
      let result: { path: string };
      switch (exportData.exportType) {
        case ".glb":
        case ".gltf": result = await api.export.gltf(req); break;
        case ".obj": result = await api.export.obj(req); break;
        case ".stl": result = await api.export.stl(req); break;
        case ".bvh": result = await api.export.bvh(req); break;
        default: result = await api.export.obj(req);
      }
      setStatusMsg(`Exported → ${result.path}`);
    } catch (e) {
      setStatusMsg(String(e));
    }
  }, [backendOnline, api, exportData]);

  // ─── View / camera ─────────────────────────────────────────────────────────

  const handleViewChange = useCallback((patch: Partial<ViewState>) => {
    setViewState((v) => ({ ...v, ...patch }));
  }, []);

  const handleCameraAction = useCallback(
    (action: "top" | "bottom" | "left" | "right" | "front" | "back") => {
      setStatusMsg(`Camera: ${action} view`);
    }, []
  );

  // ─── Menu callbacks ────────────────────────────────────────────────────────

  const menuCallbacks: MenuBarCallbacks = {
    onInfo: () => setStatusMsg("MakeHuman 2 – Open Source 3D Human Modelling"),
    onLoadModel: () => { handleToolMode(0); setCategoryMode(2); },
    onSaveModel: () => { handleToolMode(0); setCategoryMode(3); },
    onExportModel: () => { handleToolMode(0); setCategoryMode(4); handleExport(); },
    onDownloadAssets: () => { handleToolMode(0); setCategoryMode(5); },
    onQuit: () => { if (typeof window !== "undefined") window.close?.(); },
    // Settings
    onPreferences: () => setStatusMsg("Preferences – configure in MakeHuman 2 core"),
    onSceneSettings: () => setStatusMsg("Scene settings – configure in MakeHuman 2 core"),
    onMessages: () => setStatusMsg("Message log"),
    onCreateBinariesUser3d: () => setStatusMsg("Creating user 3D object binaries…"),
    onCreateBinariesUserTargets: () => setStatusMsg("Creating user target binaries…"),
    onRegenerateUser3d: () => setStatusMsg("Regenerating user 3D object binaries…"),
    onBackupUserDB: () => setStatusMsg("Backup user database…"),
    onRestoreUserDB: () => setStatusMsg("Restore user database…"),
    // Tools
    onSelectBasemesh: () => { handleToolMode(0); setCategoryMode(0); },
    onSelectSkin: () => { handleToolMode(0); setCategoryMode(1); },
    onModelling: () => { handleToolMode(1); setCategoryMode(0); },
    onRandomize: () => handleRandomize(0),
    onEquipment: (cat) => { handleToolMode(2); setCategoryMode(cat); },
    onAnimation: (cat) => { handleToolMode(3); setCategoryMode(cat); },
    // Activate
    socketActive,
    onToggleSocket: () => setSocketActive((v) => !v),
    diamondSkeleton,
    onToggleDiamondSkeleton: () => setDiamondSkeleton((v) => !v),
    floorInsteadOfGrid,
    onToggleFloor: () => setFloorInsteadOfGrid((v) => !v),
    displayCameraPos,
    onToggleCameraPos: () => setDisplayCameraPos((v) => !v),
    // Information
    onCharacterInfo: () => { handleGetChar(); },
    onMemoryInfo: () => setStatusMsg("Memory info – available in MakeHuman 2 core"),
    onLocalOpenGLInfo: () => setStatusMsg("Local OpenGL information – available in MakeHuman 2 core"),
    onUsedLibraryVersions: () => setStatusMsg("Library versions – available in MakeHuman 2 core"),
    onLicense: () => setStatusMsg("MakeHuman 2 is licensed under AGPL v3"),
    onCredits: () => setStatusMsg("MakeHuman 2 – see project credits"),
    // Help
    onContextHelp: () => setStatusMsg("Context help – hover over controls for tooltips"),
    onShortSummary: () => setStatusMsg("MakeHuman 2 – 3D human character modelling tool"),
    onNavigation: () => setStatusMsg("Navigation: LMB rotate · MMB pan · Scroll zoom"),
    onFileSystem: () => setStatusMsg("File system – user data in ~/Documents/MakeHuman2"),
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
          onRecalc={() => {
            if (backendOnline) {
              api.mesh.summary()
                .then((s) => setStatusMsg(`Mesh: ${s.vertex_count} verts · ${s.face_count} faces`))
                .catch(() => setStatusMsg("Recalculating normals…"));
            } else {
              setStatusMsg("Recalculating normals…");
            }
          }}
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
          onUseItem={handleUseItem}
          onRemoveItem={handleRemoveItem}
          onInfoItem={(type, name) => setStatusMsg(`Info: ${type} – ${name}`)}
          onDownloadItem={(type, name) => setStatusMsg(`Download queued: ${type} – ${name}`)}
          onMorphChange={handleMorphChange}
        />
      </div>

      {/* Status bar */}
      <StatusBar
        status={status}
        characterName={characterName}
        appName={appName}
        logMessage={
          backendOnline
            ? statusMsg
            : statusMsg
              ? `${statusMsg}  [REST offline]`
              : "REST backend offline"
        }
      />
    </div>
  );
}

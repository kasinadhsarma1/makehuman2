"use client";

import patterns from "@/lib/patterns";
import { useState, useRef, useEffect } from "react";
import {
  Info,
  FolderOpen,
  Save,
  Upload,
  Download,
  LogOut,
  Settings,
  Lightbulb,
  MessageSquare,
  Wrench,
  User,
  Palette,
  Shuffle,
  Shirt,
  ChevronRight,
  Activity,
  Ruler,
  CheckSquare,
  Square,
  Bug,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MenuBarCallbacks {
  onInfo: () => void;
  onLoadModel: () => void;
  onSaveModel: () => void;
  onExportModel: () => void;
  onDownloadAssets: () => void;
  onQuit: () => void;
  // Settings
  onPreferences: () => void;
  onSceneSettings: () => void;
  onMessages: () => void;
  onCreateBinariesUser3d: () => void;
  onCreateBinariesUserTargets: () => void;
  onRegenerateUser3d: () => void;
  onBackupUserDB: () => void;
  onRestoreUserDB: () => void;
  // Tools
  onSelectBasemesh: () => void;
  onSelectSkin: () => void;
  onModelling: () => void;
  onRandomize: () => void;
  onEquipment: (category: number) => void;
  onAnimation: (category: number) => void;
  // Activate toggles
  socketActive: boolean;
  onToggleSocket: () => void;
  diamondSkeleton: boolean;
  onToggleDiamondSkeleton: () => void;
  floorInsteadOfGrid: boolean;
  onToggleFloor: () => void;
  displayCameraPos: boolean;
  onToggleCameraPos: () => void;
  // Information
  onCharacterInfo: () => void;
  onMemoryInfo: () => void;
  onLocalOpenGLInfo: () => void;
  onUsedLibraryVersions: () => void;
  onLicense: () => void;
  onCredits: () => void;
  // Help
  onContextHelp: () => void;
  onShortSummary: () => void;
  onNavigation: () => void;
  onFileSystem: () => void;
}

interface MenuItem {
  label?: string;
  icon?: React.ReactNode;
  action?: () => void;
  separator?: boolean;
  submenu?: MenuItem[];
  checkable?: boolean;
  checked?: boolean;
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────

function Dropdown({
  items,
  onClose,
}: {
  items: MenuItem[];
  onClose: () => void;
}) {
  return (
    <div className="absolute top-full left-0 mt-0.5 min-w-[200px] bg-[#1a1a1a] border border-white/[0.1] rounded-md shadow-2xl z-50 py-1 overflow-hidden">
      {items.map((item, i) => {
        if (item.separator) {
          return <div key={i} className="my-1 border-t border-white/[0.08]" />;
        }
        if (item.submenu) {
          return <SubMenu key={i} item={item} onClose={onClose} />;
        }
        return (
          <button
            key={i}
            onClick={() => {
              item.action?.();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors text-left"
          >
            {item.checkable ? (
              item.checked ? (
                <CheckSquare className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              ) : (
                <Square className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              )
            ) : item.icon ? (
              <span className="shrink-0 text-zinc-500">{item.icon}</span>
            ) : (
              <span className="w-3.5 h-3.5 shrink-0" />
            )}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function SubMenu({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={patterns.input.searchWrapper}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors cursor-default">
        {item.icon ? (
          <span className="shrink-0 text-zinc-500">{item.icon}</span>
        ) : (
          <span className="w-3.5 h-3.5 shrink-0" />
        )}
        <span className="flex-1">{item.label}</span>
        <ChevronRight className="w-3 h-3 text-zinc-500 ml-auto" />
      </div>
      {open && item.submenu && (
        <div className="absolute left-full top-0 min-w-[180px] bg-[#1a1a1a] border border-white/[0.1] rounded-md shadow-2xl z-50 py-1">
          {item.submenu.map((sub, i) => (
            <button
              key={i}
              onClick={() => {
                sub.action?.();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors text-left"
            >
              <span className="w-3.5 h-3.5 shrink-0" />
              {sub.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Menu button ──────────────────────────────────────────────────────────────

function MenuButton({
  label,
  items,
  activeMenu,
  setActiveMenu,
}: {
  label: string;
  items: MenuItem[];
  activeMenu: string | null;
  setActiveMenu: (m: string | null) => void;
}) {
  const isOpen = activeMenu === label;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, setActiveMenu]);

  return (
    <div ref={ref} className={patterns.input.searchWrapper}>
      <button
        onClick={() => setActiveMenu(isOpen ? null : label)}
        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
          isOpen
            ? "bg-white/[0.08] text-white"
            : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
        }`}
      >
        {label}
      </button>
      {isOpen && (
        <Dropdown items={items} onClose={() => setActiveMenu(null)} />
      )}
    </div>
  );
}

// ─── MenuBar ──────────────────────────────────────────────────────────────────

export function MenuBar({ cb, appName }: { cb: MenuBarCallbacks; appName: string }) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menus: { label: string; items: MenuItem[] }[] = [
    {
      label: "File",
      items: [
        { label: "Load Model", icon: <FolderOpen className="w-3.5 h-3.5" />, action: cb.onLoadModel },
        { label: "Save Model", icon: <Save className="w-3.5 h-3.5" />, action: cb.onSaveModel },
        { label: "Export Model", icon: <Upload className="w-3.5 h-3.5" />, action: cb.onExportModel },
        { label: "Download Assets", icon: <Download className="w-3.5 h-3.5" />, action: cb.onDownloadAssets },
        { separator: true },
        { label: "Quit", icon: <LogOut className="w-3.5 h-3.5" />, action: cb.onQuit },
      ],
    },
    {
      label: "Settings",
      items: [
        { label: "Preferences", icon: <Settings className="w-3.5 h-3.5" />, action: cb.onPreferences },
        { label: "Lights and Scene", icon: <Lightbulb className="w-3.5 h-3.5" />, action: cb.onSceneSettings },
        { label: "Messages", icon: <MessageSquare className="w-3.5 h-3.5" />, action: cb.onMessages },
        { separator: true },
        {
          label: "Create Binaries",
          icon: <Wrench className="w-3.5 h-3.5" />,
          submenu: [
            { label: "User 3d Objects", action: cb.onCreateBinariesUser3d },
            { label: "User Targets",    action: cb.onCreateBinariesUserTargets },
          ],
        },
        {
          label: "Regenerate all Binaries",
          submenu: [
            { label: "User 3d Objects", action: cb.onRegenerateUser3d },
          ],
        },
        { separator: true },
        { label: "Backup User Database",  action: cb.onBackupUserDB },
        { label: "Restore User Database", action: cb.onRestoreUserDB },
      ],
    },
    {
      label: "Tools",
      items: [
        { label: "Select Basemesh",       icon: <User className="w-3.5 h-3.5" />,    action: cb.onSelectBasemesh },
        { label: "Select Base Material",  icon: <Palette className="w-3.5 h-3.5" />, action: cb.onSelectSkin },
        { label: "Change Character",      icon: <Ruler className="w-3.5 h-3.5" />,   action: cb.onModelling },
        { label: "Randomize Character",   icon: <Shuffle className="w-3.5 h-3.5" />, action: cb.onRandomize },
        { separator: true },
        {
          label: "Equipment",
          icon: <Shirt className="w-3.5 h-3.5" />,
          submenu: [
            { label: "Clothes",    action: () => cb.onEquipment(0) },
            { label: "Hair",       action: () => cb.onEquipment(1) },
            { label: "Eyes",       action: () => cb.onEquipment(2) },
            { label: "Eyebrows",   action: () => cb.onEquipment(3) },
            { label: "Eyelashes",  action: () => cb.onEquipment(4) },
            { label: "Teeth",      action: () => cb.onEquipment(5) },
            { label: "Tongue",     action: () => cb.onEquipment(6) },
            { label: "Proxy",      action: () => cb.onEquipment(7) },
          ],
        },
        {
          label: "Animation",
          icon: <Activity className="w-3.5 h-3.5" />,
          submenu: [
            { label: "Rigs",              action: () => cb.onAnimation(0) },
            { label: "Poses",             action: () => cb.onAnimation(1) },
            { label: "Animation",         action: () => cb.onAnimation(2) },
            { label: "Expressions",       action: () => cb.onAnimation(3) },
            { label: "Expression Editor", action: () => cb.onAnimation(4) },
            { label: "Pose Editor",       action: () => cb.onAnimation(5) },
          ],
        },
      ],
    },
    {
      label: "Activate",
      items: [
        {
          label: "Diamond skeleton",
          checkable: true,
          checked: cb.diamondSkeleton,
          action: cb.onToggleDiamondSkeleton,
        },
        {
          label: "Floor instead of grid",
          checkable: true,
          checked: cb.floorInsteadOfGrid,
          action: cb.onToggleFloor,
        },
        {
          label: "Socket active",
          checkable: true,
          checked: cb.socketActive,
          action: cb.onToggleSocket,
        },
        {
          label: "Display camera position",
          checkable: true,
          checked: cb.displayCameraPos,
          action: cb.onToggleCameraPos,
        },
        { separator: true },
        {
          label: "Debug messages",
          icon: <Bug className="w-3.5 h-3.5" />,
          submenu: [
            { label: "Low log level" },
            { label: "Mid log level" },
            { label: "Memory management" },
            { label: "File access" },
          ],
        },
      ],
    },
    {
      label: "Information",
      items: [
        { label: "Character Info",         icon: <Ruler className="w-3.5 h-3.5" />,    action: cb.onCharacterInfo },
        { label: "Memory Info",            icon: <Activity className="w-3.5 h-3.5" />, action: cb.onMemoryInfo },
        { separator: true },
        { label: "Local OpenGL Information", action: cb.onLocalOpenGLInfo },
        { label: "Used library versions",    action: cb.onUsedLibraryVersions },
        { separator: true },
        { label: "License",                  action: cb.onLicense },
        {
          label: "3rd Party licenses",
          submenu: [
            { label: "PyGLM" },
            { label: "PyOpenGL" },
            { label: "Pillow" },
            { label: "NumPy" },
          ],
        },
        { label: "Credits",                  action: cb.onCredits },
        { separator: true },
        { label: "About MakeHuman 2", icon: <Info className="w-3.5 h-3.5" />, action: cb.onInfo },
      ],
    },
    {
      label: "Help",
      items: [
        { label: "Context Help",   action: cb.onContextHelp },
        { label: "Short Summary",  action: cb.onShortSummary },
        { label: "Navigation",     action: cb.onNavigation },
        { label: "File System",    action: cb.onFileSystem },
      ],
    },
  ];

  return (
    <div className="flex items-center h-8 px-2 bg-[#111] border-b border-white/[0.07] shrink-0 gap-1">
      {/* Logo / About */}
      <button
        onClick={cb.onInfo}
        className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/[0.08] transition-colors mr-1"
        title="About MakeHuman 2"
      >
        <User className="w-3.5 h-3.5 text-violet-400" />
      </button>

      {menus.map((m) => (
        <MenuButton
          key={m.label}
          label={m.label}
          items={m.items}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
        />
      ))}

      {/* Title spacer */}
      <div className="flex-1 text-center text-[11px] text-zinc-500 pointer-events-none select-none">
        {appName}
      </div>
    </div>
  );
}

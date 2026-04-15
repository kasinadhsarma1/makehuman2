"use client";

/**
 * Central viewport – shows the 3D render area.
 * In the Electron frontend we can't directly embed the OpenGL window from
 * the Python core, so this shows connection status, character info, and
 * a visual placeholder that mirrors the core's viewport area.
 */

import { viewportPatterns, typographyPatterns } from "@/lib/patterns";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Wifi, WifiOff, Shuffle, RefreshCw, AlertCircle, CheckCircle2,
} from "lucide-react";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface ViewportProps {
  status: ConnectionStatus;
  appName: string;
  characterName: string;
  baseMesh: string;
  loadingRandomize: boolean;
  loadingGetChar: boolean;
  onRandomize: () => void;
  onGetChar: () => void;
  charJsonKeys?: string[];
}

function StatusDot({ status }: { status: ConnectionStatus }) {
  const cls: Record<ConnectionStatus, string> = {
    disconnected: "bg-zinc-500",
    connecting:   "bg-amber-400 animate-pulse",
    connected:    "bg-emerald-400",
    error:        "bg-red-500",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${cls[status]}`} />;
}

export function Viewport({
  status, appName, characterName, baseMesh,
  loadingRandomize, loadingGetChar, onRandomize, onGetChar,
  charJsonKeys = [],
}: ViewportProps) {
  const connected = status === "connected";

  return (
    <div className={`flex-1 flex flex-col min-w-0 ${viewportPatterns.container}`}>
      {/* Top info bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-white/[0.06] bg-[#0e0e0e] shrink-0">
        <StatusDot status={status} />
        <span className="text-xs text-zinc-400 capitalize font-medium">{status}</span>

        {connected && (
          <>
            <span className="text-zinc-700">|</span>
            <span className="text-xs text-zinc-400">{appName}</span>
            <span className="text-zinc-700">|</span>
            <span className="text-xs text-zinc-300 font-medium">{characterName}</span>
            {baseMesh && (
              <>
                <span className="text-zinc-700">|</span>
                <span className={`${typographyPatterns.mono}`}>{baseMesh}</span>
              </>
            )}
          </>
        )}

        <div className="flex-1" />

        {connected && (
          <div className={viewportPatterns.hud.topRight}>
            <button
              onClick={onGetChar}
              disabled={loadingGetChar}
              title="Refresh character data"
              className={viewportPatterns.viewControls.button}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingGetChar ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onRandomize}
              disabled={loadingRandomize}
              title="Randomize character"
              className={viewportPatterns.viewControls.button}
            >
              <Shuffle className={`w-3.5 h-3.5 ${loadingRandomize ? "animate-spin" : ""}`} />
            </button>
          </div>
        )}
      </div>

      {/* Viewport body */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Dot-grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <AnimatePresence mode="wait">
          {status === "disconnected" && (
            <motion.div
              key="disc"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 text-center z-10"
            >
              <div className="w-20 h-20 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center">
                <WifiOff className="w-9 h-9 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-400">Not connected</p>
                <p className="text-xs text-zinc-600 mt-1 max-w-xs">
                  Start <span className="font-mono text-zinc-500">makehuman.py</span> and
                  connect from the sidebar to see the character viewport.
                </p>
              </div>
            </motion.div>
          )}

          {status === "connecting" && (
            <motion.div
              key="conn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 z-10"
            >
              <Wifi className="w-8 h-8 text-amber-400 animate-pulse" />
              <p className="text-xs text-zinc-400">Connecting to core…</p>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="err"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 z-10"
            >
              <AlertCircle className="w-8 h-8 text-red-500" />
              <p className="text-xs text-red-400">Could not reach MakeHuman 2 core</p>
              <p className="text-[10px] text-zinc-600 max-w-xs text-center">
                Make sure <span className="font-mono">makehuman.py</span> is running and the
                socket is active (Activate → Socket active)
              </p>
            </motion.div>
          )}

          {status === "connected" && (
            <motion.div
              key="connected"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6 z-10 w-full max-w-lg px-6"
            >
              {/* Character silhouette placeholder */}
              <div className="relative">
                <div className="w-40 h-56 rounded-2xl border border-violet-500/20 bg-gradient-to-b from-violet-900/10 to-transparent flex items-end justify-center pb-4">
                  <User className="w-20 h-20 text-violet-400/30" strokeWidth={1} />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#131313] px-3 py-1 rounded-full border border-white/[0.08]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {characterName || "Character loaded"}
                  </span>
                </div>
              </div>

              {/* Character stats */}
              {charJsonKeys.length > 0 && (
                <div className="w-full grid grid-cols-3 gap-2">
                  {charJsonKeys.slice(0, 6).map((key) => (
                    <div
                      key={key}
                      className="text-center py-2 px-3 rounded-lg bg-white/[0.03] border border-white/[0.05]"
                    >
                      <span className={`${typographyPatterns.mono} capitalize`}>{key}</span>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-zinc-600 text-center">
                3D rendering is handled by the MakeHuman 2 core (OpenGL).<br />
                Use the core window to view and interact with the 3D viewport.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

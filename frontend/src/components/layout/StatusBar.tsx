"use client";

import type { ConnectionStatus } from "./Viewport";

export function StatusBar({
  status,
  characterName,
  appName,
  logMessage,
}: {
  status: ConnectionStatus;
  characterName: string;
  appName: string;
  logMessage: string;
}) {
  const statusColors: Record<ConnectionStatus, string> = {
    disconnected: "text-zinc-600",
    connecting: "text-amber-400",
    connected: "text-emerald-400",
    error: "text-red-400",
  };

  return (
    <div className="h-6 border-t border-white/[0.07] bg-[#0a0a0a] flex items-center px-3 gap-4 shrink-0">
      <span className={`text-[10px] font-medium capitalize ${statusColors[status]}`}>
        {status}
      </span>
      {appName && (
        <span className="text-[10px] text-zinc-600">
          {appName}
        </span>
      )}
      {characterName && (
        <span className="text-[10px] text-zinc-500">
          Character: <span className="text-zinc-300">{characterName}</span>
        </span>
      )}
      <div className="flex-1" />
      {logMessage && (
        <span className="text-[10px] text-zinc-600 truncate max-w-xs">
          {logMessage}
        </span>
      )}
      <span className="text-[10px] text-zinc-700">MakeHuman 2</span>
    </div>
  );
}

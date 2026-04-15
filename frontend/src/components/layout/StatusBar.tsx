"use client";

import { statusBarPatterns } from "@/lib/patterns";
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
  const activityCls: Record<ConnectionStatus, string> = {
    disconnected: statusBarPatterns.activity.idle,
    connecting:   statusBarPatterns.activity.working,
    connected:    statusBarPatterns.activity.done,
    error:        statusBarPatterns.activity.error,
  };

  const statusTextCls: Record<ConnectionStatus, string> = {
    disconnected: statusBarPatterns.item,
    connecting:   statusBarPatterns.itemWarning,
    connected:    statusBarPatterns.itemSuccess,
    error:        statusBarPatterns.itemError,
  };

  return (
    <div className={statusBarPatterns.bar}>
      {/* Connection status */}
      <span className={activityCls[status]} />
      <span className={`${statusTextCls[status]} font-medium capitalize`}>
        {status}
      </span>

      <span className={statusBarPatterns.separator} />

      {/* App name */}
      {appName && (
        <span className={statusBarPatterns.item}>{appName}</span>
      )}

      {/* Character name */}
      {characterName && (
        <>
          <span className={statusBarPatterns.separator} />
          <span className={statusBarPatterns.item}>
            Character:{" "}
            <span className={statusBarPatterns.itemHighlight}>{characterName}</span>
          </span>
        </>
      )}

      <div className={statusBarPatterns.spacer} />

      {/* Log message */}
      {logMessage && (
        <span className={`${statusBarPatterns.item} truncate max-w-xs`}>
          {logMessage}
        </span>
      )}

      <span className={statusBarPatterns.separator} />
      <span className={statusBarPatterns.item}>MakeHuman 2</span>
    </div>
  );
}

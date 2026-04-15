/**
 * MakeHuman 2 – Electron Main Process
 *
 * Launches the BrowserWindow (loading Next.js dev server or static export)
 * and bridges IPC calls to the Python core's TCP socket API.
 *
 * Offline-desktop optimisations:
 *   • show:false + ready-to-show   → eliminates white flash on startup
 *   • backgroundColor: "#0a0a0a"  → dark background before React paints
 *   • backgroundThrottling: false  → no lag / dropped frames when unfocused
 *   • spellcheck: false            → skip unnecessary spell-check passes
 *   • Window-state persistence     → restores size/position across launches
 *   • F12 toggle DevTools          → convenient; auto-open only in dev
 *   • 5 s TCP socket timeout       → fast fail when Python core is offline
 */

const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path   = require("path");
const net    = require("net");
const fs     = require("fs");
const { spawn } = require("child_process");

// ─── GPU / rendering fix ──────────────────────────────────────────────────────
//
// On Linux with certain GPU drivers (Mesa, NVIDIA, AMD) the Chromium compositor
// can present the framebuffer with inverted coordinates, causing ALL rendered
// content (text, icons) to appear as a mirror image (characters reversed).
// Symptoms: "GetVSyncParametersIfAvailable() failed" errors in the terminal.
//
// app.disableHardwareAcceleration() switches Chromium to software (CPU)
// rasterisation — guaranteed correct rendering at the cost of GPU compositing.
// For a UI-heavy desktop tool this is the right trade-off.
//
// Must be called BEFORE app is ready (before app.whenReady()).
app.disableHardwareAcceleration();

// Additional command-line switches that prevent the GPU path from being
// re-enabled by Chromium's internal feature flags:
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-gpu-compositing");
app.commandLine.appendSwitch("disable-gpu-vsync");

const isDev = !app.isPackaged && process.env.NODE_ENV !== "production";

// ─── FastAPI backend auto-spawn ───────────────────────────────────────────────

let backendProcess = null;

/**
 * Poll TCP port 8000 until a connection succeeds or the deadline passes.
 * Returns true when ready, false on timeout.
 */
function pollBackendReady(maxMs = 12_000) {
  return new Promise((resolve) => {
    const deadline = Date.now() + maxMs;

    function attempt() {
      if (Date.now() >= deadline) { resolve(false); return; }

      const probe = new net.Socket();
      probe.setTimeout(500);
      probe.connect(8000, "127.0.0.1", () => {
        probe.destroy();
        resolve(true);
      });
      probe.on("error",   () => { probe.destroy(); setTimeout(attempt, 500); });
      probe.on("timeout", () => { probe.destroy(); setTimeout(attempt, 500); });
    }

    attempt();
  });
}

/**
 * Spawn the FastAPI backend using the repo's venv Python (or system python3).
 * Resolves when the backend is accepting connections (or after 12 s timeout).
 */
async function startBackend() {
  // Repo root is two levels up from electron/
  const repoRoot = path.join(__dirname, "../..");

  const venvPython = process.platform === "win32"
    ? path.join(repoRoot, "venv/Scripts/python.exe")
    : path.join(repoRoot, "venv/bin/python");

  const python = fs.existsSync(venvPython) ? venvPython : "python3";

  backendProcess = spawn(
    python,
    ["-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"],
    {
      cwd: repoRoot,
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
      // In dev show backend logs in the same terminal; in prod silence them
      stdio: isDev ? "inherit" : "pipe",
    }
  );

  backendProcess.on("error", (err) => {
    console.error("[backend] Failed to start:", err.message);
    backendProcess = null;
  });

  backendProcess.on("exit", (code, signal) => {
    if (code !== 0 && signal !== "SIGTERM" && signal !== "SIGINT") {
      console.warn(`[backend] Exited unexpectedly — code ${code}, signal ${signal}`);
    }
    backendProcess = null;
  });

  const ready = await pollBackendReady(12_000);
  if (!ready) {
    console.warn("[backend] Did not become ready within 12 s — the UI will show offline.");
  }
}

// ─── Window state persistence ─────────────────────────────────────────────────

function stateFilePath() {
  return path.join(app.getPath("userData"), "window-state.json");
}

function loadWindowState() {
  try {
    const raw = fs.readFileSync(stateFilePath(), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveWindowState(win) {
  try {
    // Don't save minimised/maximised positions — restore to last normal bounds
    if (win.isMinimized() || win.isMaximized() || win.isFullScreen()) return;
    const [x, y] = win.getPosition();
    const [w, h] = win.getSize();
    fs.writeFileSync(stateFilePath(), JSON.stringify({ x, y, width: w, height: h }));
  } catch { /* ignore write errors */ }
}

// ─── Window ───────────────────────────────────────────────────────────────────

let mainWindow = null;

function createWindow() {
  const saved = loadWindowState();

  mainWindow = new BrowserWindow({
    // Restore last size/position, fall back to sensible defaults
    width:     saved?.width  ?? 1280,
    height:    saved?.height ?? 800,
    x:         saved?.x,
    y:         saved?.y,
    minWidth:  960,
    minHeight: 600,
    title: "MakeHuman 2",

    // Dark background matches app colour — no white flash before React renders
    backgroundColor: "#0a0a0a",

    // Hide until content is ready (eliminates blank-window flash on startup)
    show: false,

    webPreferences: {
      preload:              path.join(__dirname, "preload.js"),
      contextIsolation:     true,
      nodeIntegration:      false,
      sandbox:              false,

      // Prevent frame-rate drops / event starvation when window is unfocused
      // or partially off-screen.  Critical for smooth UI during background work.
      backgroundThrottling: false,

      // Not needed for a 3D tool; skip the overhead
      spellcheck:           false,
    },
  });

  mainWindow.setMenu(null);

  // ── Show window only once content has rendered ────────────────────────────
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    // Only auto-open DevTools in dev; user can always toggle with F12
    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: "detach" });
    }
  });

  // ── Load content ──────────────────────────────────────────────────────────
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    // Static export — all assets are local, no network needed
    mainWindow.loadFile(path.join(__dirname, "../out/index.html"));
  }

  // ── Persist window bounds ─────────────────────────────────────────────────
  mainWindow.on("resize", () => saveWindowState(mainWindow));
  mainWindow.on("move",   () => saveWindowState(mainWindow));
  mainWindow.on("close",  () => saveWindowState(mainWindow));
  mainWindow.on("closed", () => { mainWindow = null; });

  // ── F12 toggles DevTools ──────────────────────────────────────────────────
  mainWindow.webContents.on("before-input-event", (_event, input) => {
    if (input.type === "keyDown" && input.key === "F12") {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // ── External links open in system browser ─────────────────────────────────
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(async () => {
  // Spawn the FastAPI backend before opening the window so the UI can connect
  // immediately after render.  Non-fatal if it fails — UI shows "offline" state.
  await startBackend();

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("will-quit", () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ─── TCP Socket helper ────────────────────────────────────────────────────────

/**
 * Send a JSON request to the MakeHuman 2 Python core and return the parsed
 * JSON response.  The Python server closes the connection after each reply
 * so we simply collect all bytes until EOF.
 *
 * Timeout:  5 000 ms — fast-fail when the core is not running so the
 *           frontend shows an error promptly instead of hanging.
 *
 * @param {string}  host
 * @param {number}  port
 * @param {object}  payload  Plain JS object — will be JSON-serialised
 * @param {boolean} binary   If true, resolves with a Buffer instead of JSON
 * @returns {Promise<object|Buffer>}
 */
function mhRequest(host, port, payload, binary = false) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    const chunks = [];
    let settled  = false;

    function settle(fn) {
      if (settled) return;
      settled = true;
      client.destroy();
      fn();
    }

    client.connect(port, host, () => {
      client.write(JSON.stringify(payload));
    });

    client.on("data",  (chunk) => chunks.push(chunk));

    client.on("end", () => {
      settle(() => {
        const buf = Buffer.concat(chunks);
        if (binary) {
          resolve(buf);
        } else {
          try {
            resolve(JSON.parse(buf.toString("utf8")));
          } catch (e) {
            reject(new Error("Invalid JSON from core: " + buf.toString("utf8").slice(0, 120)));
          }
        }
      });
    });

    client.on("error", (err) => settle(() => reject(err)));

    // 5-second timeout — surface a clear error instead of hanging
    client.setTimeout(5_000, () =>
      settle(() => reject(new Error("Connection to Python core timed out (5 s)")))
    );
  });
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

// ping / hello
ipcMain.handle("mh:hello", async (_event, { host, port } = {}) => {
  const cfg = { host: host || "127.0.0.1", port: port || 12345 };
  try {
    const res = await mhRequest(cfg.host, cfg.port, { function: "hello" });
    return { ok: true, data: res };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// get character JSON
ipcMain.handle("mh:getchar", async (_event, { host, port, scale, onground, hidden, anim } = {}) => {
  const cfg    = { host: host || "127.0.0.1", port: port || 12345 };
  const params = {
    scale:    scale    !== undefined ? scale    : 0.1,
    onground: onground !== undefined ? onground : true,
    hidden:   hidden   !== undefined ? hidden   : false,
    anim:     anim     !== undefined ? anim     : false,
  };
  try {
    const res = await mhRequest(cfg.host, cfg.port, { function: "getchar", params });
    return { ok: true, data: res };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// randomize
ipcMain.handle("mh:randomize", async (_event, { host, port, mode } = {}) => {
  const cfg = { host: host || "127.0.0.1", port: port || 12345 };
  try {
    const res = await mhRequest(cfg.host, cfg.port, {
      function: "randomize",
      params: { mode: mode || 0 },
    });
    return { ok: true, data: res };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// get binary buffers (after getchar)
ipcMain.handle("mh:bin_getchar", async (_event, { host, port } = {}) => {
  const cfg = { host: host || "127.0.0.1", port: port || 12345 };
  try {
    const buf = await mhRequest(cfg.host, cfg.port, { function: "bin_getchar" }, true);
    return { ok: true, byteLength: buf.length };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

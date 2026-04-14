/**
 * MakeHuman 2 - Electron Main Process
 *
 * Launches the BrowserWindow (loading Next.js dev server or static export)
 * and bridges IPC calls to the Python core's TCP socket API (default 127.0.0.1:12345).
 */

const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const net = require("net");

const isDev = process.env.NODE_ENV !== "production";

// ─── Window ───────────────────────────────────────────────────────────────────

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: "MakeHuman 2",
    backgroundColor: "#0a0a0a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.setMenu(null);

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../out/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Open external links in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
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
 * @param {string} host
 * @param {number} port
 * @param {object} payload  Plain JS object that will be JSON-serialised
 * @param {boolean} binary  If true, resolves with a Buffer instead of JSON
 * @returns {Promise<object|Buffer>}
 */
function mhRequest(host, port, payload, binary = false) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    const chunks = [];

    client.connect(port, host, () => {
      client.write(JSON.stringify(payload));
    });

    client.on("data", (chunk) => chunks.push(chunk));

    client.on("end", () => {
      const buf = Buffer.concat(chunks);
      if (binary) {
        resolve(buf);
      } else {
        try {
          resolve(JSON.parse(buf.toString("utf8")));
        } catch (e) {
          reject(new Error("Invalid JSON response: " + buf.toString("utf8")));
        }
      }
    });

    client.on("error", (err) => {
      reject(err);
    });

    // 5-second timeout
    client.setTimeout(5000, () => {
      client.destroy();
      reject(new Error("Connection timed out"));
    });
  });
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

/**
 * Returns the connection config stored in the event sender's session, or
 * falls back to defaults.
 */
function getConfig(event) {
  // Renderer can pass { host, port } inside each call; handled per-call below.
  return { host: "127.0.0.1", port: 12345 };
}

// ping / hello ─────────────────────────────────────────────────────────────────
ipcMain.handle("mh:hello", async (_event, { host, port } = {}) => {
  const cfg = { host: host || "127.0.0.1", port: port || 12345 };
  try {
    const res = await mhRequest(cfg.host, cfg.port, { function: "hello" });
    return { ok: true, data: res };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// get character JSON ──────────────────────────────────────────────────────────
ipcMain.handle(
  "mh:getchar",
  async (_event, { host, port, scale, onground, hidden, anim } = {}) => {
    const cfg = { host: host || "127.0.0.1", port: port || 12345 };
    const params = {
      scale: scale !== undefined ? scale : 0.1,
      onground: onground !== undefined ? onground : true,
      hidden: hidden !== undefined ? hidden : false,
      anim: anim !== undefined ? anim : false,
    };
    try {
      const res = await mhRequest(cfg.host, cfg.port, {
        function: "getchar",
        params,
      });
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
);

// randomize ───────────────────────────────────────────────────────────────────
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

// get binary buffers (after getchar) ─────────────────────────────────────────
ipcMain.handle(
  "mh:bin_getchar",
  async (_event, { host, port } = {}) => {
    const cfg = { host: host || "127.0.0.1", port: port || 12345 };
    try {
      const buf = await mhRequest(
        cfg.host,
        cfg.port,
        { function: "bin_getchar" },
        true
      );
      return { ok: true, byteLength: buf.length };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
);

/**
 * MakeHuman 2 – FastAPI REST client
 *
 * Base URL resolution order:
 *   1. NEXT_PUBLIC_MH2_API_URL env var  (e.g. "http://127.0.0.1:8000")
 *   2. Constructed from host + port via createApiClient()
 *   3. "" (empty) → uses Next.js dev-mode proxy on /api/v1/*
 *
 * Every fetch has an AbortController timeout so a dead backend never hangs
 * the UI.  Health/info probes use HEALTH_TIMEOUT_MS (3 s); everything else
 * uses DEFAULT_TIMEOUT_MS (8 s).
 */

// ─── Timeout constants ────────────────────────────────────────────────────────

/** Short timeout for liveness probes that run on every connect attempt. */
export const HEALTH_TIMEOUT_MS = 3_000;
/** Default timeout for data operations (morph load, asset list, export…). */
export const DEFAULT_TIMEOUT_MS = 8_000;

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function request<T>(
  base: string,
  method: string,
  path: string,
  body?: unknown,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const url = `${base}/api/v1${path}`;

  try {
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`${method} ${path} → ${res.status}: ${text}`);
    }

    // 204 No Content — return undefined rather than trying to parse JSON
    if (res.status === 204) return undefined as T;

    return res.json() as Promise<T>;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`${method} ${path} timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Response / model types ───────────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  version: string;
}

export interface AppInfo {
  application: string;
  version: string;
  data_path: string;
  user_path: string;
}

export interface MacroValues {
  age?: number;
  gender?: number;
  weight?: number;
  height?: number;
  muscle?: number;
  breast_size?: number;
  breast_firmness?: number;
  body_proportions?: number;
}

export interface CharacterInfo {
  name: string;
  uuid: string;
  author: string;
  description: string;
  tags: string[];
  base_mesh: string;
  skin_material: string;
  macro_values: MacroValues;
  modifier_count: number;
}

export interface MorphModifier {
  path: string;
  name: string;
  category: string;
  value: number;
  default_value: number;
  min: number;
  max: number;
}

export interface MorphCategory {
  name: string;
  count: number;
  sub_categories: string[];
}

export interface MorphBatchUpdate {
  modifiers: { path: string; value: number }[];
}

export interface AssetModel {
  name: string;
  asset_type: string;
  uuid?: string;
  author?: string;
  tags: string[];
  thumbnail?: string;
}

export type EquipmentState = Record<string, AssetModel | null>;

export interface BoneModel {
  name: string;
  head: [number, number, number];
  tail: [number, number, number];
  roll?: number;
  parent?: string;
  children: string[];
}

export interface SkeletonModel {
  name: string;
  bones: BoneModel[];
}

export interface PoseModel {
  name: string;
  source_file?: string;
}

export interface MaterialModel {
  name: string;
  diffuse_color: [number, number, number];
  specular_color: [number, number, number];
  shininess: number;
  diffuse_texture?: string;
  normal_map?: string;
}

export interface ExportRequest {
  output_path: string;
  scale?: number;
  binary?: boolean;
  pack_textures?: boolean;
  feet_on_ground?: boolean;
  posed?: boolean;
}

export interface MeshSummary {
  vertex_count: number;
  face_count: number;
  base_mesh: string;
}

// ─── API client class ─────────────────────────────────────────────────────────

export class MhApiClient {
  private base: string;

  /**
   * @param base  Origin without trailing slash, e.g. "http://127.0.0.1:8000"
   *              Pass "" to use the Next.js dev-mode proxy (/api/v1/* → backend).
   */
  constructor(base = "") {
    this.base = base.replace(/\/$/, "");
  }

  // HTTP verbs — each accepts an optional per-call timeout override
  private _get   = <T>(path: string, ms?: number) => request<T>(this.base, "GET",    path, undefined, ms);
  private _post  = <T>(path: string, body?: unknown, ms?: number) => request<T>(this.base, "POST",   path, body, ms);
  private _put   = <T>(path: string, body?: unknown, ms?: number) => request<T>(this.base, "PUT",    path, body, ms);
  private _patch = <T>(path: string, body?: unknown, ms?: number) => request<T>(this.base, "PATCH",  path, body, ms);
  private _del   = <T>(path: string, ms?: number) => request<T>(this.base, "DELETE", path, undefined, ms);

  // ── Info (fast health-check timeouts) ─────────────────────────────────────

  health = () => this._get<HealthResponse>("/health", HEALTH_TIMEOUT_MS);
  info   = () => this._get<AppInfo>("/info",          HEALTH_TIMEOUT_MS);
  config = () => this._get<Record<string, unknown>>("/info/config", HEALTH_TIMEOUT_MS);

  // ── Character ─────────────────────────────────────────────────────────────

  character = {
    get:      ()                                         => this._get<CharacterInfo>("/character"),
    list:     ()                                         => this._get<CharacterInfo[]>("/character/list"),
    create:   ()                                         => this._post<CharacterInfo>("/character/new"),
    load:     (path: string)                             => this._post<CharacterInfo>("/character/load", { path }),
    save:     (path: string)                             => this._post<{ path: string }>("/character/save", { path }),
    randomize:(body?: { mode?: number; seed?: number })  => this._post<CharacterInfo>("/character/randomize", body ?? {}),
    delete:   ()                                         => this._del<{ ok: boolean }>("/character"),
  };

  // ── Morphs ────────────────────────────────────────────────────────────────

  morphs = {
    list:       (category?: string) =>
      this._get<MorphModifier[]>(`/morphs${category ? `?category=${encodeURIComponent(category)}` : ""}`),
    categories: ()                  => this._get<MorphCategory[]>("/morphs/categories"),
    modified:   ()                  => this._get<MorphModifier[]>("/morphs/modified"),
    values:     ()                  => this._get<Record<string, number>>("/morphs/values"),
    get:        (path: string)      => this._get<MorphModifier>(`/morphs/${encodeURIComponent(path)}`),
    set:        (path: string, value: number) =>
      this._put<MorphModifier>(`/morphs/${encodeURIComponent(path)}`, { value }),
    batch:      (updates: MorphBatchUpdate) =>
      this._post<MorphModifier[]>("/morphs/batch", updates),
    reset:      ()                  => this._post<{ ok: boolean }>("/morphs/reset"),
  };

  // ── Assets ────────────────────────────────────────────────────────────────

  assets = {
    list:         (assetType?: string) =>
      this._get<AssetModel[]>(`/assets${assetType ? `?asset_type=${assetType}` : ""}`),
    equipment:    ()                   => this._get<EquipmentState>("/assets/equipment"),
    baseMeshes:   ()                   => this._get<string[]>("/assets/base-meshes"),
    rebuildCache: ()                   => this._post<{ ok: boolean }>("/assets/rebuild-cache"),
    byType:       (type: string)       => this._get<AssetModel[]>(`/assets/${type}`),
    apply:        (type: string, name: string, uuid?: string) =>
      this._post<EquipmentState>(`/assets/${type}/apply`, { name, uuid }),
    remove:       (type: string, name: string) =>
      this._del<EquipmentState>(`/assets/${type}/${encodeURIComponent(name)}`),
    setSkin:      (name: string)       => this._post<{ ok: boolean }>("/assets/skin", { name }),
    clearAll:     ()                   => this._del<{ ok: boolean }>("/assets/equipment"),
  };

  // ── Skeleton ──────────────────────────────────────────────────────────────

  skeleton = {
    get:       ()                                => this._get<SkeletonModel>("/skeleton"),
    list:      ()                                => this._get<string[]>("/skeleton/list"),
    load:      (name: string)                    => this._post<SkeletonModel>("/skeleton/load", { name }),
    poses:     ()                                => this._get<PoseModel[]>("/skeleton/poses"),
    getPose:   ()                                => this._get<PoseModel>("/skeleton/pose"),
    setPose:   (name: string)                    => this._post<PoseModel>("/skeleton/pose", { name }),
    setBone:   (bone: string, rotation: number[]) =>
      this._put<{ ok: boolean }>("/skeleton/pose/bone", { bone, rotation }),
    resetPose: ()                                => this._del<{ ok: boolean }>("/skeleton/pose"),
  };

  // ── Export ────────────────────────────────────────────────────────────────

  export = {
    mhm:  (req: ExportRequest) => this._post<{ path: string }>("/export/mhm",  req),
    obj:  (req: ExportRequest) => this._post<{ path: string }>("/export/obj",  req),
    stl:  (req: ExportRequest) => this._post<{ path: string }>("/export/stl",  req),
    gltf: (req: ExportRequest) => this._post<{ path: string }>("/export/gltf", req),
    bvh:  (req: ExportRequest) => this._post<{ path: string }>("/export/bvh",  req),
  };

  // ── Materials ─────────────────────────────────────────────────────────────

  materials = {
    list:   ()                                           => this._get<MaterialModel[]>("/materials"),
    get:    (name: string)                               => this._get<MaterialModel>(`/materials/${encodeURIComponent(name)}`),
    load:   (path: string)                               => this._post<MaterialModel>("/materials/load", { path }),
    update: (name: string, body: Partial<MaterialModel>) =>
      this._patch<MaterialModel>(`/materials/${encodeURIComponent(name)}`, body),
  };

  // ── Mesh ──────────────────────────────────────────────────────────────────

  mesh = {
    summary:    () => this._get<MeshSummary>("/mesh/summary"),
    baseMeshes: () => this._get<string[]>("/mesh/base-meshes"),
  };
}

// ─── Default client (uses Next.js dev proxy or NEXT_PUBLIC_MH2_API_URL) ───────

export const defaultApi = new MhApiClient(
  process.env.NEXT_PUBLIC_MH2_API_URL ?? ""
);

/** Build a client pointing at a specific host, e.g. createApiClient("127.0.0.1", 8000) */
export function createApiClient(host: string, port = 8000): MhApiClient {
  return new MhApiClient(`http://${host}:${port}`);
}

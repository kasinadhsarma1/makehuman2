/**
 * MakeHuman 2 – FastAPI REST client
 *
 * Base URL resolution order:
 *   1. NEXT_PUBLIC_MH2_API_URL env var  (e.g. "http://127.0.0.1:8000")
 *   2. Constructed from host + MH2_API_PORT (default 8000) at call-time via createApiClient()
 *   3. "" (empty) → falls through to Next.js dev-mode proxy on /api/v1/*
 */

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function request<T>(
  base: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${base}/api/v1${path}`;
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
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

  private get = <T>(path: string)                      => request<T>(this.base, "GET",    path);
  private post = <T>(path: string, body?: unknown)     => request<T>(this.base, "POST",   path, body);
  private put  = <T>(path: string, body?: unknown)     => request<T>(this.base, "PUT",    path, body);
  private patch = <T>(path: string, body?: unknown)    => request<T>(this.base, "PATCH",  path, body);
  private del  = <T>(path: string)                     => request<T>(this.base, "DELETE", path);

  // ── Info ────────────────────────────────────────────────────────────────────

  health = () => this.get<HealthResponse>("/health");
  info   = () => this.get<AppInfo>("/info");
  config = () => this.get<Record<string, unknown>>("/info/config");

  // ── Character ───────────────────────────────────────────────────────────────

  character = {
    get:      ()                                         => this.get<CharacterInfo>("/character"),
    list:     ()                                         => this.get<CharacterInfo[]>("/character/list"),
    create:   ()                                         => this.post<CharacterInfo>("/character/new"),
    load:     (path: string)                             => this.post<CharacterInfo>("/character/load", { path }),
    save:     (path: string)                             => this.post<{ path: string }>("/character/save", { path }),
    randomize:(body?: { mode?: number; seed?: number })  => this.post<CharacterInfo>("/character/randomize", body ?? {}),
    delete:   ()                                         => this.del<{ ok: boolean }>("/character"),
  };

  // ── Morphs ──────────────────────────────────────────────────────────────────

  morphs = {
    list:       (category?: string) =>
      this.get<MorphModifier[]>(`/morphs${category ? `?category=${encodeURIComponent(category)}` : ""}`),
    categories: ()                  => this.get<MorphCategory[]>("/morphs/categories"),
    modified:   ()                  => this.get<MorphModifier[]>("/morphs/modified"),
    values:     ()                  => this.get<Record<string, number>>("/morphs/values"),
    get:        (path: string)      => this.get<MorphModifier>(`/morphs/${encodeURIComponent(path)}`),
    set:        (path: string, value: number) =>
      this.put<MorphModifier>(`/morphs/${encodeURIComponent(path)}`, { value }),
    batch:      (updates: MorphBatchUpdate) =>
      this.post<MorphModifier[]>("/morphs/batch", updates),
    reset:      ()                  => this.post<{ ok: boolean }>("/morphs/reset"),
  };

  // ── Assets ──────────────────────────────────────────────────────────────────

  assets = {
    list:         (assetType?: string) =>
      this.get<AssetModel[]>(`/assets${assetType ? `?asset_type=${assetType}` : ""}`),
    equipment:    ()                   => this.get<EquipmentState>("/assets/equipment"),
    baseMeshes:   ()                   => this.get<string[]>("/assets/base-meshes"),
    rebuildCache: ()                   => this.post<{ ok: boolean }>("/assets/rebuild-cache"),
    byType:       (type: string)       => this.get<AssetModel[]>(`/assets/${type}`),
    apply:        (type: string, name: string, uuid?: string) =>
      this.post<EquipmentState>(`/assets/${type}/apply`, { name, uuid }),
    remove:       (type: string, name: string) =>
      this.del<EquipmentState>(`/assets/${type}/${encodeURIComponent(name)}`),
    setSkin:      (name: string)       => this.post<{ ok: boolean }>("/assets/skin", { name }),
    clearAll:     ()                   => this.del<{ ok: boolean }>("/assets/equipment"),
  };

  // ── Skeleton ─────────────────────────────────────────────────────────────────

  skeleton = {
    get:       ()                                => this.get<SkeletonModel>("/skeleton"),
    list:      ()                                => this.get<string[]>("/skeleton/list"),
    load:      (name: string)                    => this.post<SkeletonModel>("/skeleton/load", { name }),
    poses:     ()                                => this.get<PoseModel[]>("/skeleton/poses"),
    getPose:   ()                                => this.get<PoseModel>("/skeleton/pose"),
    setPose:   (name: string)                    => this.post<PoseModel>("/skeleton/pose", { name }),
    setBone:   (bone: string, rotation: number[]) =>
      this.put<{ ok: boolean }>("/skeleton/pose/bone", { bone, rotation }),
    resetPose: ()                                => this.del<{ ok: boolean }>("/skeleton/pose"),
  };

  // ── Export ───────────────────────────────────────────────────────────────────

  export = {
    mhm:  (req: ExportRequest) => this.post<{ path: string }>("/export/mhm",  req),
    obj:  (req: ExportRequest) => this.post<{ path: string }>("/export/obj",  req),
    stl:  (req: ExportRequest) => this.post<{ path: string }>("/export/stl",  req),
    gltf: (req: ExportRequest) => this.post<{ path: string }>("/export/gltf", req),
    bvh:  (req: ExportRequest) => this.post<{ path: string }>("/export/bvh",  req),
  };

  // ── Materials ────────────────────────────────────────────────────────────────

  materials = {
    list:   ()                                           => this.get<MaterialModel[]>("/materials"),
    get:    (name: string)                               => this.get<MaterialModel>(`/materials/${encodeURIComponent(name)}`),
    load:   (path: string)                               => this.post<MaterialModel>("/materials/load", { path }),
    update: (name: string, body: Partial<MaterialModel>) =>
      this.patch<MaterialModel>(`/materials/${encodeURIComponent(name)}`, body),
  };

  // ── Mesh ─────────────────────────────────────────────────────────────────────

  mesh = {
    summary:    () => this.get<MeshSummary>("/mesh/summary"),
    baseMeshes: () => this.get<string[]>("/mesh/base-meshes"),
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

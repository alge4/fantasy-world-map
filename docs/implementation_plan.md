# IMPLEMENTATION PLAN

## A) Tech Stack Decision

- **Engine (preferred):** Unreal Engine 5 (VHM, Nanite, RVT) for editor‑grade visuals & tools.
- **Alt (browser):** Babylon.js/Three.js with WebGPU where available; KTX2 textures; glTF assets.

**Storage:** Object storage (S3/GCS) for tiles; Postgres/Supabase for metadata; signed URLs.\
**Serialization:** KTX2 (splat/normal), EXR/PNG16 (height), GeoJSON (vectors), glTF/GLB (settlements).\
**Scripting:** C++ + Blueprints (UE5) or TypeScript (web).

---

## B) Workstreams & Milestones

### Milestone 1 — Terrain Core & Viewer (3–4 weeks)

**Deliverables**

- Seeded continent generator, heightmap 4k–8k, flow accumulation, rivers.
- 3D viewer: orbit cam, LOD terrain, basic water, river ribbons.
- Style #1: Realistic PBR terrain material (triplanar, 4–6 layers).
- Tile IO: load `z/x/y` tiles from disk/bucket.

**Tasks**

- T1.1 Heightfield gen (plates + noise + uplift).
- T1.2 Flow + erosion pass (GPU if UE5 Niagara/Compute).
- T1.3 River vectorization + width from discharge.
- T1.4 Terrain LOD mesh pipeline (VHM/clipmaps).
- T1.5 PBR terrain material & RVT setup.
- T1.6 Tile format + loader.

**DoD**

- 60 FPS at world zoom; rivers visible; coastlines coherent.
- Tile streaming hides seams; memory under budget.

---

### Milestone 2 — Editing Tools & Locking (3–4 weeks)

**Deliverables**

- Elevation/biome brushes with live preview.
- Local hydro recompute on edit (tile + immediate downstream).
- Lock/finalize per tile; versioned deltas.

**Tasks**

- T2.1 Brush system (GPU paint into edit delta atlas).
- T2.2 Normal/flow recompute schedulers.
- T2.3 Biome rules + painter with guardrails.
- T2.4 Tile lock/versioning; undo/redo ring buffer.

**DoD**

- Brush latency < 150 ms; downstream rivers respond correctly to dam/cut edits.

---

### Milestone 3 — Style Swapping & Atlas Mode (2–3 weeks)

**Deliverables**

- Style #2: Hand‑Drawn Atlas (toon light, outlines, hatching, stipple forests).
- One‑click style switch; persistent labels/icons with collision.

**Tasks**

- T3.1 Shared G‑buffer spec (height, slope, curvature, biome, water).
- T3.2 Atlas materials + post (paper, ink).
- T3.3 Label/icon vector overlay; style profiles (fonts, icons).

**DoD**

- Style swap in < 200 ms; no geometry pop; labels adapt.

---

### Milestone 4 — POIs, Settlements, Roads (3–5 weeks)

**Deliverables**

- Settlement stamp with templates; city impostors (far) → meshes (near).
- POI stamp wizard with constraint suggestions & heatmaps.
- Auto‑road with least‑cost path; bridges at narrow spans.

**Tasks**

- T4.1 Suitability heatmap shader & scoring.
- T4.2 Settlement generator (street graph, districts, optional walls).
- T4.3 POI schema + wizard + candidate ranking.
- T4.4 Least‑cost routing (slope² + swamps + toll borders); bridge siting.
- T4.5 Vector persistence & editing.

**DoD**

- Drop 5 settlements; routes connect; candidates show justification.

---

### Milestone 5 — Exports, Player View, Integrations (2–3 weeks)

**Deliverables**

- Export PNG/PDF tiles; Foundry/Roll20 packages with pins.
- Player client (read‑only, reveal‑aware).
- Faux Orator link: POI → campaign entity.

**Tasks**

- T5.1 Exporter aligned to on‑screen camera + DPI.
- T5.2 Visibility flags; publish pipeline to player client.
- T5.3 REST hooks for POI <→ campaign DB.

**DoD**

- Player map matches DM framing; POI reveals propagate.

---

## C) Engineering Specs

### C.1 Shared G‑Buffer / Material Inputs

- `height`, `normalWS`, `slope`, `curvature`, `biome_id`, `water_mask`, `snowline`, `territory_id`
- Optional masks: `anomaly_mask`, `edit_delta`

### C.2 Least‑Cost Path (roads)

- Cost = `a*slope^2 + b*swamp + c*river_cross + d*border_toll + e*forest_density`
- Dijkstra/A\* on raster, then polyline simplification (Douglas‑Peucker) + smoothing (Catmull‑Rom).
- Bridge placement where river width < threshold and banks are stable (slope < T, flood < F).

### C.3 Settlement Generator

- Template fit (river bend/coast/hill/crossroads).
- Street graph via biased L‑system + least‑slope.
- District growth rings by age/economy; farmland belts; harbor check (bathymetry + shelter).

### C.4 Tile Formats

- **Height:** EXR 16f; **Normals:** KTX2 BC5/ETC2; **Splat:** KTX2 BC7; **Vectors:** GeoJSON; **Meshes:** GLB w/ Meshopt.
- **Naming:** `/world/{seed}/{z}/{x}/{y}/{layer}.{ext}`

---

## D) Quality, Telemetry, Testing

- **Golden Scenes:** 3 hand‑picked tiles for perf/visual regression.
- **Perf HUD:** frame time, tile I/O, draw calls, VRAM; target 60 FPS.
- **Unit:** scoring, routing, hydro recompute.
- **Integration:** style swap identity (same POI positions across styles).
- **UX:** brush latency, undo/redo, export fidelity.

---

## E) Risks & Mitigations

- **GPU budget** (atlas outlines + PBR): use RVT/KTX2, impostors, LODs.
- **Erosion cost:** windowed/local recompute; cache; compute shaders.
- **Style drift:** shared G‑buffer contract; visual snapshots per style.
- **Data bloat:** compress; prune deep detail to only edited tiles.

---

## F) Roadmap After MVP

- Seasons/time (snowline, river volume).
- Province development (CK‑style building stacks).
- Trade networks & cultural diffusion layers.
- Procedural story hooks (auto‑quests by geography).
- Collaborative DM editing; multi‑campaign shards.

---

## G) Definitions of Done (Global)

- **Performance:** meets targets on mid‑tier hardware (RTX 2060 / M1 Pro).
- **Determinism:** re‑seeding + stored deltas reproduce the same world.
- **Style‑Agnostic:** geometry/POI identity stable across styles.
- **Docs:** user guide (DM), tech notes (engine), tile schema reference.
- **CI:** automated builds; unit/integration tests pass; regression gallery green.

---

## H) Team & Roles

- **Engine/Rendering Lead** (terrain, materials, styles)
- **Procedural Sim Engineer** (tectonics, hydro, climate, biomes)
- **Tools/UX Engineer** (brushes, wizards, overlays)
- **Backend Engineer** (tiles, storage, APIs, exports)
- **Tech Artist** (style packs, icons, hatching, impostors)
- **Designer/DM Advocate** (workflows, acceptance tests)

---

## I) Kickoff Checklist

- Pick **UE5 vs Web** path and lock tile schema.
- Approve MVP scope & milestones.
- Create regression scene bundle.
- Draft icon/font packs for Atlas/Political styles.
- Stub REST endpoints and storage bucket layout.

---

*End of Draft v0.1*
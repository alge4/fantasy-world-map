# Procedural 3D DnD World Map — Product Specification & Implementation Plan

**Project Codename:** StratCart

**Author:** Alex + Team\
**Date:** 2025‑08‑17\
**Version:** 0.1 (Draft)

---

## 1) Vision & Problem Statement

**We want** a DM-first, procedurally believable, zoomable 3D world map (Crusader Kings / Total War vibe) that the DM can *paint* to control how the world grows.

**Players see** a stylized or realistic view depending on DM’s chosen style, with fog-of-war and progressive reveals.\
**DMs can** place settlements, roads, borders, and quest POIs with smart, realism-aware tools.

---

## 2) Goals

- **Believability:** Realistic continents, rivers, climate, biomes, erosion.
- **DM Control:** Brushes (elevation/biome/hydro), stamps (settlement/POI), automatic but overrideable rules.
- **3D, Multi-Scale:** Smooth LOD from world → region → town → street (selective deep detail).
- **Style Swapping:** Realistic PBR ↔ hand‑drawn atlas ↔ political ↔ hex‑crawl via shader/material packs.
- **Controlled Sprawl:** Lock tiles, expand outward procedurally on demand.
- **Integration Hooks:** Link POIs to campaign content (e.g., Faux Orator).

### Non‑Goals (v1)

- Full city‑level interior generation per building.
- MMO-scale multiplayer streaming.
- Photoreal satellite imagery.

---

## 3) Key User Stories

1. **As a DM**, I paint a coastline and raise a mountain chain; rivers form and biomes update.
2. **As a DM**, I stamp a town; roads auto-route to the nearest trade network; I tweak walls and districts.
3. **As a DM**, I place a quest ruin within 30 km of a city but at least 3 km from settlements; the tool suggests candidates with reasoning.
4. **As a DM**, I lock a region, then expand the world one ring of tiles further east.
5. **As a DM**, I switch styles from realistic to parchment atlas and export a player map.
6. **As a Player**, I see only revealed POIs; labels and icons match the style the DM chooses.

---

## 4) System Overview

**Architecture:** World facts (simulation data) are stored separately from rendering (style/materials).\
**Tiling:** Quadtree `z/x/y` tiles with per‑LOD data (height, flow, biome, splats, vectors).\
**Rendering:** 3D terrain with chunked LOD; style packs swap materials and post‑processing.

---

## 5) Data Model (World Facts)

### 5.1 Raster Grids per Tile

- `height`: float32 heightmap (EXR/PNG16)
- `normal`: encoded normal map (PNG/KTX2)
- `flow_accum`: upstream cell count (TIFF/float)
- `water_mask`: 0..1 (sea/lake/river)
- `temp`: °C annual mean
- `rain`: mm/year
- `biome_id`: u8 index (Whittaker classification)
- `splat_weights`: up to 8 terrain materials, KTX2 compressed
- `edit_delta`: RGBA layers for DM edits (non‑destructive)

### 5.2 Vector Layers per Tile

- `rivers`: polyline w/ width & discharge
- `coast`: polyline
- `roads`: polyline (class, surface, profile)
- `borders`: polygon ribbons (province/realm/culture)
- `poi`: points with metadata (settlement/quest/landmark/etc.)

### 5.3 POI Schema (example)

```json
{
  "poi_id": "city:veloria",
  "type": "settlement",
  "subtype": "city",
  "name": "Veloria",
  "loc": {"lat": 41.203, "lon": -12.441, "tile": "z/x/y"},
  "elevation_m": 42,
  "tags": ["capital","river_port","walled"],
  "pop_est": 48000,
  "economy": {"grain": 0.7, "timber": 0.2, "ore": 0.1},
  "links": {"roads": ["road:r3a2"], "river": "river:ester", "region": "prov:velor"},
  "lore_ref": {"campaign_id": "FO-123", "entity_id": "city_veloria"},
  "visibility": "dm_only",
  "locked": true
}
```

---

## 6) Procedural Simulation Pipeline

1. **Continents:** Plate seeds (Voronoi), uplift at boundaries, base noise, coastal shelves.
2. **Hydrology:** Compute flow → carve river valleys (hydraulic erosion pass) → lakes/deltas.
3. **Climate:** Latitude bands + prevailing winds + orographic rain + ocean currents.
4. **Biomes:** Whittaker (temp × precip) → landcover & soils; derive fertility.
5. **Settlements/Routes:** Suitability scoring (water, slope, fertility, centrality) → seed; least‑cost roads.

**Determinism:** World seeded; DM edits applied as delta masks so regen is reproducible.

---

## 7) Editing Tools (DM)

- **Sculpt Elevation:** raise/lower/smooth/terrace; recompute normals/flow locally.
- **Hydro Brush:** force springs, dig channels, adjust lake outlets; downstream recompute.
- **Climate/Biome Brush:** paint temp/rain/biome with rules for transitions & rain shadows.
- **Settlement Stamp:** hamlet→city; templates (river bend, coastal bay, hilltop, crossroads).
- **POI Stamp:** dungeon/ruin/shrine/lair/portal/landmark with constraint wizard.
- **Road/Bridge/Pass/Harbor:** autoroute + guided placement with span/depth checks.
- **Border/Culture Painter:** flood‑fill with ridge/river snapping; border ribbons.
- **Lock/Finalize:** freeze tiles; versioned history & rollback.

**Shortcuts:** `1` Settlement • `2` POI • `R` Auto Road • `B` Bridge • `L` Lock • `H` Heatmap

---

## 8) Realism & Constraints

- **Suitability Score** `S = Σ w_i * x_i` over: distance to river/coast, slope, flood index, rainfall, soil, trade centrality, resources, biome/latitude gates.
- **Tier guards:** Town S≥3; City S≥6 + centrality/strategic tag.
- **Spacing:** Poisson disk to avoid crowding (overrideable).
- **Hydro sanity:** cities/roads avoid floodplains unless engineered (bridge/causeway).

---

## 9) Rendering & Styles

**Style packs** consume world facts via G‑buffers & vector layers; swapping style does not touch facts.

### 9.1 Styles (v1)

- **Realistic PBR:** triplanar blends (rock/grass/scree/sand/snow); SSAO/SSR water; wind‑animated foliage impostors.
- **Hand‑Drawn Atlas:** toon light, edge outlines (Sobel), slope hatching, stippled forests, parchment post.
- **Political Overview:** extruded territories, border ribbons, territory tints, minimal terrain.
- **Hex‑Crawl:** hex overlay; biome tokens; population-scaled icons.

### 9.2 Labels & Icons

- Vector overlay (screen‑space) with collision; style‑specific fonts/icons; DM override per POI.

---

## 10) LOD & Streaming

- **Quadtree tiles**; chunked terrain LOD with skirts or clipmaps.
- **Distant:** rivers as ribbons, settlements as impostors.
- **Near:** stream high‑res height/splat; swap settlement impostors for meshes; street‑level optional tiles.
- **Selective deep detail:** only tiles the DM opens receive street‑level generation.

---

## 11) APIs (Draft)

```
POST /world/expand { seed, ring:1, direction:"E" }
POST /edit/height { tile, brush:{type:"gauss", strength, radius}, center:{x,y}, mode:"raise|lower|smooth" }
POST /hydro/recompute { tile, downstream:true }
POST /poi/settlement { subtype:"town", loc:{lat,lon}, options:{snap:true,walls:true} }
POST /poi/quest/suggest { type:"ruin", near:"city:veloria", within_km:30, avoid_settlements_km:3, biome:["forest","hills"], n:5 }
POST /roads/autoroute { from:"city:veloria", to:"town:wald", profile:"medieval|roman" }
POST /style/switch { style:"realistic|atlas|political|hexcrawl" }
POST /export/player-map { bbox, style, zoom, format:"png|pdf|vtt" }
```

---

## 12) Performance Targets (v1)

- **Load:** initial world view < 3 s on mid‑range GPU (RTX 2060 / M1 Pro).
- **Pan/Zoom:** 60 FPS typical, 30 FPS minimum under load.
- **Edit latency:** < 150 ms for brush feedback; < 1 s for local hydro recompute.
- **Tile size:** ≤ 8 MB per high‑res tile (compressed), ≤ 1 MB for common LODs.

---

## 13) Security & Roles

- **Roles:** DM (edit + reveal), Player (view revealed only).
- **Visibility:** per‑POI and per‑region flags: `dm_only | player_on_reveal | public`.
- **Change Log:** append‑only events; rollback per tile/POI.

---

## 14) MVP Scope (v1.0)

- World gen (continents→biomes), rivers, lakes, basic climate.
- 3D viewer with Realistic + Atlas styles; labels; fog-of‑war.
- Brushes: elevation, biome; Stamps: settlement, POI; Auto‑roads + bridges.
- Tile lock & expand.
- Exports for VTT.
- Basic Faux Orator link (POI → entity id).

---

## 15) Acceptance Criteria (MVP)

- Generate a continent and place 5+ settlements with plausible sites confirmed by heatmap.
- Auto‑road connects at least 3 settlements with bridges at sensible narrow spans.
- Style switch (Realistic ↔ Atlas) maintains identical POI geometry, labels reposition appropriately.
- Editing elevation upstream updates river paths within the edited tile and immediate downstream tiles.
- Exported PNG (atlas) matches on‑screen framing within ±2 px and preserves POI positions.

---
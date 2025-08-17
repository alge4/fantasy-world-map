import { z } from "zod";

// Draft API schemas aligned with docs/Product Specification.md

export const WorldExpandSchema = z.object({
  seed: z.string().min(1),
  ring: z.number().int().min(1),
  direction: z.enum(["N", "S", "E", "W"]).default("E"),
});

export type WorldExpandRequest = z.infer<typeof WorldExpandSchema>;

export const EditHeightSchema = z.object({
  tile: z.string().min(1),
  brush: z.object({
    type: z.enum(["gauss", "linear", "smooth"]),
    strength: z.number(),
    radius: z.number().positive(),
  }),
  center: z.object({ x: z.number(), y: z.number() }),
  mode: z.enum(["raise", "lower", "smooth", "terrace"]),
});

export type EditHeightRequest = z.infer<typeof EditHeightSchema>;

export const HydroRecomputeSchema = z.object({
  tile: z.string().min(1),
  downstream: z.boolean().default(true),
});

export type HydroRecomputeRequest = z.infer<typeof HydroRecomputeSchema>;

export const PoiSettlementSchema = z.object({
  subtype: z.enum(["hamlet", "village", "town", "city"]).default("town"),
  loc: z.object({ lat: z.number(), lon: z.number() }),
  options: z
    .object({
      snap: z.boolean().default(true),
      walls: z.boolean().default(false),
    })
    .default({ snap: true, walls: false }),
});

export type PoiSettlementRequest = z.infer<typeof PoiSettlementSchema>;

export const PoiQuestSuggestSchema = z.object({
  type: z
    .enum(["ruin", "shrine", "lair", "portal", "landmark"])
    .default("ruin"),
  near: z.string().min(1),
  within_km: z.number().positive().default(30),
  avoid_settlements_km: z.number().positive().default(3),
  biome: z
    .array(
      z
        .enum(["forest", "hills", "plains", "mountains", "swamp", "desert"])
        .default("forest")
    )
    .optional(),
  n: z.number().int().min(1).max(25).default(5),
});

export type PoiQuestSuggestRequest = z.infer<typeof PoiQuestSuggestSchema>;

export const RoadsAutorouteSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  profile: z.enum(["medieval", "roman"]).default("medieval"),
});

export type RoadsAutorouteRequest = z.infer<typeof RoadsAutorouteSchema>;

export const StyleSwitchSchema = z.object({
  style: z
    .enum(["realistic", "atlas", "political", "hexcrawl"])
    .default("realistic"),
});

export type StyleSwitchRequest = z.infer<typeof StyleSwitchSchema>;

export const ExportPlayerMapSchema = z.object({
  bbox: z.object({
    minLat: z.number(),
    minLon: z.number(),
    maxLat: z.number(),
    maxLon: z.number(),
  }),
  style: z
    .enum(["realistic", "atlas", "political", "hexcrawl"])
    .default("atlas"),
  zoom: z.number().int().min(1).max(22).default(5),
  format: z.enum(["png", "pdf", "vtt"]).default("png"),
});

export type ExportPlayerMapRequest = z.infer<typeof ExportPlayerMapSchema>;

export type ApiError = { error: string };

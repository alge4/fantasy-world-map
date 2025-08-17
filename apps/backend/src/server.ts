import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import {
  WorldExpandSchema,
  EditHeightSchema,
  HydroRecomputeSchema,
  PoiSettlementSchema,
  PoiQuestSuggestSchema,
  RoadsAutorouteSchema,
  StyleSwitchSchema,
  ExportPlayerMapSchema,
} from "@world-map/shared";

dotenv.config();

const server = Fastify({ logger: true });
await server.register(cors, { origin: true });

server.post("/world/expand", async (request, reply) => {
  const parse = WorldExpandSchema.safeParse(request.body);
  if (!parse.success)
    return reply.code(400).send({ error: parse.error.message });
  const { seed, ring, direction } = parse.data;
  return { ok: true, seed, ring, direction, note: "stubbed expansion" };
});

server.post("/edit/height", async (request, reply) => {
  const parse = EditHeightSchema.safeParse(request.body);
  if (!parse.success)
    return reply.code(400).send({ error: parse.error.message });
  return { ok: true, applied: 1, note: "height edit stub" };
});

server.post("/hydro/recompute", async (request, reply) => {
  const parse = HydroRecomputeSchema.safeParse(request.body);
  if (!parse.success)
    return reply.code(400).send({ error: parse.error.message });
  return {
    ok: true,
    updatedTiles: [parse.data.tile],
    downstream: parse.data.downstream,
  };
});

server.post("/poi/settlement", async (request, reply) => {
  const parse = PoiSettlementSchema.safeParse(request.body);
  if (!parse.success)
    return reply.code(400).send({ error: parse.error.message });
  return {
    ok: true,
    poi_id: `settlement:${Math.random().toString(36).slice(2, 8)}`,
    ...parse.data,
  };
});

server.post("/poi/quest/suggest", async (request, reply) => {
  const parse = PoiQuestSuggestSchema.safeParse(request.body);
  if (!parse.success)
    return reply.code(400).send({ error: parse.error.message });
  const suggestions = Array.from({ length: parse.data.n }).map((_, i) => ({
    id: `cand_${i}`,
    score: 0.5 + 0.05 * i,
    loc: { lat: 40 + i * 0.1, lon: -12 - i * 0.1 },
    reason: ["near water", "gentle slope", "within biome"].slice(
      0,
      1 + (i % 3)
    ),
  }));
  return { ok: true, suggestions };
});

server.post("/roads/autoroute", async (request, reply) => {
  const parse = RoadsAutorouteSchema.safeParse(request.body);
  if (!parse.success)
    return reply.code(400).send({ error: parse.error.message });
  return {
    ok: true,
    polyline: [
      { lat: 41.0, lon: -12.0 },
      { lat: 41.1, lon: -12.1 },
      { lat: 41.2, lon: -12.2 },
    ],
    bridges: [{ atIndex: 1 }],
  };
});

server.post("/style/switch", async (request, reply) => {
  const parse = StyleSwitchSchema.safeParse(request.body);
  if (!parse.success)
    return reply.code(400).send({ error: parse.error.message });
  return { ok: true, style: parse.data.style };
});

server.post("/export/player-map", async (request, reply) => {
  const parse = ExportPlayerMapSchema.safeParse(request.body);
  if (!parse.success)
    return reply.code(400).send({ error: parse.error.message });
  return { ok: true, url: "https://example.invalid/export.png" };
});

const port = Number(process.env.PORT || 4000);
server
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    server.log.info(`Backend listening on http://localhost:${port}`);
  })
  .catch((err) => {
    server.log.error(err);
    process.exit(1);
  });

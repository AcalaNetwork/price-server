import { Server } from "..";
import { QUERY_RATE_LIMITED_PORT } from "../utils";
import { queryRoutes } from "./routes";
import fastifyRateLimit from "@fastify/rate-limit";

export const server = new Server(
  QUERY_RATE_LIMITED_PORT,
  "query-rate-limited",
  process.env.KARURA_ENDPOINT
);
server.registeMiddlies(fastifyRateLimit, {
  max: 30,
  timeWindow: '1 minute',
  // IP whitelist
  allowList: ['127.0.0.1']
});
server.registeRoutes(queryRoutes);

server.start(async () => {
  await server.initiateApi();
  console.log("API successfully initiated");
});

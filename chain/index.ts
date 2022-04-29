import { Server } from "..";
import { CHAIN_PORT } from "../utils";
import { fetchTradingPairs } from "./fetchData";
import { chainRoutes } from "./routes";

export const server = new Server(
  CHAIN_PORT,
  "chain",
  process.env.KARURA_ENDPOINT
);
server.registeRoutes(chainRoutes);

server.start(async () => {
  await server.initiateApi();
  console.log("API successfully initiated");
  fetchTradingPairs();
});

setInterval(() => {
  fetchTradingPairs();
}, 1000 * 60 * 30);

